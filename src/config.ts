import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface NewsAPIConfig {
  name: string;
  apiKey: string;
  baseUrl: string;
  dailyLimit: number;
  priority: number; // Lower number = higher priority
  isActive: boolean;
}

export interface NewsAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  apiUsed?: string;
  remainingQuota?: number;
}

// API configurations with priority order
export const NEWS_APIS: NewsAPIConfig[] = [
  {
    name: 'TheNewsAPI',
    apiKey: process.env.THE_NEWS_API_KEY || '',
    baseUrl: 'https://api.thenewsapi.com/v1/news',
    dailyLimit: 999999, // Claimed unlimited
    priority: 1,
    isActive: !!process.env.THE_NEWS_API_KEY
  },
  {
    name: 'NewsData.io',
    apiKey: process.env.NEWSDATA_IO_KEY || '',
    baseUrl: 'https://newsdata.io/api/1/news',
    dailyLimit: 200, // ~200 requests/day
    priority: 2,
    isActive: !!process.env.NEWSDATA_IO_KEY
  },
  {
    name: 'NewsAPI.org',
    apiKey: process.env.NEWSAPI_ORG_KEY || '',
    baseUrl: 'https://newsapi.org/v2/everything',
    dailyLimit: 100,
    priority: 3,
    isActive: !!process.env.NEWSAPI_ORG_KEY
  },
  {
    name: 'GNews',
    apiKey: process.env.GNEWS_API_KEY || '',
    baseUrl: 'https://gnews.io/api/v4/search',
    dailyLimit: 100,
    priority: 4,
    isActive: !!process.env.GNEWS_API_KEY
  },
  {
    name: 'Twingly',
    apiKey: process.env.TWINGLY_API_KEY || '',
    baseUrl: 'https://api.twingly.com/blog/search/api/v3/search',
    dailyLimit: 50, // Estimated for trial
    priority: 5,
    isActive: !!process.env.TWINGLY_API_KEY
  }
];

// Get active APIs sorted by priority
export function getActiveAPIs(): NewsAPIConfig[] {
  return NEWS_APIS
    .filter(api => api.isActive)
    .sort((a, b) => a.priority - b.priority);
}

// Check if any API is configured
export function hasConfiguredAPIs(): boolean {
  return getActiveAPIs().length > 0;
}

// Get API configuration by name
export function getAPIConfig(name: string): NewsAPIConfig | undefined {
  return NEWS_APIS.find(api => api.name === name);
}