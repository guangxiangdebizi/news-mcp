import fetch from 'node-fetch';
import { getActiveAPIs, NewsAPIConfig, NewsAPIResponse } from '../config.js';

// Rate limiting tracker
const apiUsageTracker = new Map<string, { count: number; lastReset: Date }>();

// Reset daily counters
function resetDailyCounters() {
  const now = new Date();
  for (const [apiName, usage] of apiUsageTracker.entries()) {
    const hoursSinceReset = (now.getTime() - usage.lastReset.getTime()) / (1000 * 60 * 60);
    if (hoursSinceReset >= 24) {
      apiUsageTracker.set(apiName, { count: 0, lastReset: now });
    }
  }
}

// Check if API has remaining quota
function hasRemainingQuota(apiConfig: NewsAPIConfig): boolean {
  resetDailyCounters();
  const usage = apiUsageTracker.get(apiConfig.name);
  if (!usage) {
    apiUsageTracker.set(apiConfig.name, { count: 0, lastReset: new Date() });
    return true;
  }
  return usage.count < apiConfig.dailyLimit;
}

// Increment API usage counter
function incrementUsage(apiName: string) {
  const usage = apiUsageTracker.get(apiName);
  if (usage) {
    usage.count++;
  } else {
    apiUsageTracker.set(apiName, { count: 1, lastReset: new Date() });
  }
}

// Get remaining quota for an API
function getRemainingQuota(apiConfig: NewsAPIConfig): number {
  const usage = apiUsageTracker.get(apiConfig.name);
  if (!usage) return apiConfig.dailyLimit;
  return Math.max(0, apiConfig.dailyLimit - usage.count);
}

// Format news articles for consistent output
function formatNewsResponse(data: any, apiName: string): string {
  let formattedNews = `# 📰 News Search Results (via ${apiName})\n\n`;
  
  try {
    let articles: any[] = [];
    
    // Handle different API response formats
    switch (apiName) {
      case 'NewsAPI.org':
        articles = data.articles || [];
        break;
      case 'GNews':
        articles = data.articles || [];
        break;
      case 'TheNewsAPI':
        articles = data.data || [];
        break;
      case 'NewsData.io':
        articles = data.results || [];
        break;
      case 'Twingly':
        articles = data.posts || [];
        break;
      default:
        articles = data.articles || data.data || data.results || [];
    }
    
    if (articles.length === 0) {
      return formattedNews + "❌ No articles found for your search query.\n";
    }
    
    articles.slice(0, 10).forEach((article, index) => {
      const title = article.title || article.headline || 'No title';
      const description = article.description || article.snippet || article.summary || 'No description';
      const url = article.url || article.link || '#';
      const publishedAt = article.publishedAt || article.published_at || article.published || 'Unknown date';
      const source = article.source?.name || article.source || 'Unknown source';
      
      formattedNews += `## ${index + 1}. ${title}\n\n`;
      formattedNews += `**Source:** ${source}\n`;
      formattedNews += `**Published:** ${publishedAt}\n`;
      formattedNews += `**Description:** ${description}\n`;
      formattedNews += `**URL:** [Read more](${url})\n\n`;
      formattedNews += "---\n\n";
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    formattedNews += `❌ Error formatting news data: ${errorMessage}\n`;
  }
  
  return formattedNews;
}

// Search news using a specific API
async function searchWithAPI(apiConfig: NewsAPIConfig, query: string, language: string = 'en', pageSize: number = 10): Promise<NewsAPIResponse> {
  try {
    let url = '';
    let headers: any = {};
    
    // Build API-specific request
    switch (apiConfig.name) {
      case 'NewsAPI.org':
        url = `${apiConfig.baseUrl}?q=${encodeURIComponent(query)}&language=${language}&pageSize=${pageSize}&apiKey=${apiConfig.apiKey}`;
        break;
        
      case 'GNews':
        url = `${apiConfig.baseUrl}?q=${encodeURIComponent(query)}&lang=${language}&max=${pageSize}&apikey=${apiConfig.apiKey}`;
        break;
        
      case 'TheNewsAPI':
        url = `${apiConfig.baseUrl}/all?api_token=${apiConfig.apiKey}&search=${encodeURIComponent(query)}&language=${language}&limit=${pageSize}`;
        break;
        
      case 'NewsData.io':
        url = `${apiConfig.baseUrl}?apikey=${apiConfig.apiKey}&q=${encodeURIComponent(query)}&language=${language}&size=${pageSize}`;
        break;
        
      case 'Twingly':
        url = `${apiConfig.baseUrl}?q=${encodeURIComponent(query)}&format=json&apikey=${apiConfig.apiKey}`;
        break;
        
      default:
        throw new Error(`Unsupported API: ${apiConfig.name}`);
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Check for API-specific error responses
    if ((data as any).status === 'error' || (data as any).error) {
      throw new Error((data as any).message || (data as any).error || 'API returned an error');
    }
    
    incrementUsage(apiConfig.name);
    
    return {
      success: true,
      data,
      apiUsed: apiConfig.name,
      remainingQuota: getRemainingQuota(apiConfig)
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
      apiUsed: apiConfig.name
    };
  }
}

// Smart news search with automatic API switching
export const newsSearch = {
  name: "search_news",
  description: "Search for news articles using multiple news APIs with automatic failover. The system intelligently switches between different news APIs when one reaches its limit or fails.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for news articles (keywords, topics, etc.)"
      },
      language: {
        type: "string",
        description: "Language code for news articles (e.g., 'en', 'zh', 'es')",
        default: "en"
      },
      limit: {
        type: "number",
        description: "Maximum number of articles to return (1-10)",
        minimum: 1,
        maximum: 10,
        default: 5
      }
    },
    required: ["query"]
  },
  
  async run(args: { query: string; language?: string; limit?: number }) {
    try {
      // Validate input
      if (!args.query || args.query.trim().length === 0) {
        throw new Error("Search query cannot be empty");
      }
      
      const query = args.query.trim();
      const language = args.language || 'en';
      const limit = Math.min(Math.max(args.limit || 5, 1), 10);
      
      // Get available APIs
      const activeAPIs = getActiveAPIs();
      
      if (activeAPIs.length === 0) {
        return {
          content: [{
            type: "text",
            text: "❌ **No News APIs Configured**\n\nPlease configure at least one news API key in your .env file. Available options:\n\n" +
                  "- **NewsAPI.org**: Get free key at https://newsapi.org/register\n" +
                  "- **GNews API**: Get free key at https://gnews.io/\n" +
                  "- **TheNewsAPI**: Get free key at https://www.thenewsapi.com/\n" +
                  "- **NewsData.io**: Get free key at https://newsdata.io/\n" +
                  "- **Twingly**: Get trial key at https://www.twingly.com/news-api/\n\n" +
                  "Add your API keys to the .env file and restart the service."
          }],
          isError: true
        };
      }
      
      let lastError = '';
      let attemptedAPIs: string[] = [];
      
      // Try each API in priority order
      for (const apiConfig of activeAPIs) {
        // Skip APIs that have reached their daily limit
        if (!hasRemainingQuota(apiConfig)) {
          attemptedAPIs.push(`${apiConfig.name} (quota exceeded)`);
          continue;
        }
        
        attemptedAPIs.push(apiConfig.name);
        
        const result = await searchWithAPI(apiConfig, query, language, limit);
        
        if (result.success && result.data) {
          const formattedResponse = formatNewsResponse(result.data, result.apiUsed!);
          const quotaInfo = `\n\n---\n\n**API Used:** ${result.apiUsed}\n**Remaining Quota:** ${result.remainingQuota} requests\n**Attempted APIs:** ${attemptedAPIs.join(', ')}`;
          
          return {
            content: [{
              type: "text",
              text: formattedResponse + quotaInfo
            }]
          };
        } else {
          lastError = result.error || 'Unknown error';
          console.warn(`API ${apiConfig.name} failed: ${lastError}`);
        }
      }
      
      // All APIs failed
      return {
        content: [{
          type: "text",
          text: `❌ **All News APIs Failed**\n\n` +
                `**Query:** "${query}"\n` +
                `**Attempted APIs:** ${attemptedAPIs.join(', ')}\n` +
                `**Last Error:** ${lastError}\n\n` +
                `**Suggestions:**\n` +
                `- Check your API keys in the .env file\n` +
                `- Verify your internet connection\n` +
                `- Try a different search query\n` +
                `- Some APIs may have temporary outages`
        }],
        isError: true
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{
          type: "text",
          text: `❌ **Search Failed:** ${errorMessage}`
        }],
        isError: true
      };
    }
  }
};