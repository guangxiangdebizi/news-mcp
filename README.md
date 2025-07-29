# 📰 News MCP Server

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-0.6.0-green.svg)](https://modelcontextprotocol.io/)

A smart news search MCP (Model Context Protocol) server with **automatic API switching** for reliable news fetching. Never worry about API limits again!

## ✨ Features

- 🔄 **Smart API Switching**: Automatically switches between multiple news APIs when one reaches its limit
- 🆓 **Multiple Free APIs**: Supports 5+ free news APIs with generous daily quotas
- 📊 **Quota Management**: Intelligent tracking of daily API usage limits
- 🌍 **Multi-language Support**: Search news in 20+ languages
- ⚡ **Fast & Reliable**: Failover mechanism ensures you always get results
- 🛠️ **Easy Setup**: Simple configuration with environment variables

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/guangxiangdebizi/news-mcp.git
cd news-mcp

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. API Configuration

Get free API keys from any of these services (you only need one, but more = better reliability):

| Service | Daily Limit | Sign Up Link | Priority |
|---------|-------------|--------------|----------|
| **TheNewsAPI** | Unlimited* | [Get Key](https://www.thenewsapi.com/) | 🥇 Highest |
| **NewsData.io** | ~200 requests | [Get Key](https://newsdata.io/) | 🥈 High |
| **NewsAPI.org** | 100 requests | [Get Key](https://newsapi.org/register) | 🥉 Medium |
| **GNews** | 100 requests | [Get Key](https://gnews.io/) | 🏅 Medium |
| **Twingly** | Trial available | [Get Key](https://www.twingly.com/news-api/) | 🎖️ Low |

*\*Claimed unlimited for free tier*

### 3. Configure Environment

Edit `.env` file and add your API keys:

```env
# Add at least one API key (more is better for reliability)
THE_NEWS_API_KEY=your_api_key_here
NEWSDATA_IO_KEY=your_api_key_here
NEWSAPI_ORG_KEY=your_api_key_here
GNEWS_API_KEY=your_api_key_here
TWINGLY_API_KEY=your_api_key_here
```

### 4. Build & Run

```bash
# Build the project
npm run build

# Start the MCP server
npm start

# Or run in development mode
npm run dev
```

## 🔧 Usage

### With Claude Desktop

Add to your Claude Desktop configuration:

**Stdio Mode** (Local Development):
```json
{
  "mcpServers": {
    "news-mcp": {
      "command": "node",
      "args": ["path/to/news-mcp/build/index.js"]
    }
  }
}
```

**SSE Mode** (Web Access):
```bash
# Start SSE server
npm run sse
```

```json
{
  "mcpServers": {
    "news-mcp": {
      "type": "sse",
      "url": "http://localhost:3100/sse",
      "timeout": 600
    }
  }
}
```

### Available Tools

#### `search_news`

Search for news articles with automatic API switching.

**Parameters:**
- `query` (required): Search keywords or topics
- `language` (optional): Language code (default: "en")
- `limit` (optional): Number of articles (1-10, default: 5)

**Example:**
```typescript
// Search for technology news
{
  "query": "artificial intelligence",
  "language": "en",
  "limit": 5
}

// Search for Chinese news
{
  "query": "科技新闻",
  "language": "zh",
  "limit": 3
}
```

## 🧠 How Smart Switching Works

1. **Priority Order**: APIs are tried in order of reliability and quota limits
2. **Quota Tracking**: System tracks daily usage for each API
3. **Automatic Failover**: When an API fails or reaches limit, automatically tries the next one
4. **Success Guarantee**: Continues until successful response or all APIs exhausted

```
TheNewsAPI (∞) → NewsData.io (200) → NewsAPI.org (100) → GNews (100) → Twingly (50)
```

## 📊 Supported Languages

- **English** (en) - All APIs
- **Chinese** (zh) - Most APIs
- **Spanish** (es) - Most APIs
- **French** (fr) - Most APIs
- **German** (de) - Most APIs
- **And 15+ more languages**

## 🛠️ Development

### Project Structure

```
src/
├── index.ts              # MCP server entry point
├── config.ts             # API configuration management
└── tools/
    └── newsSearch.ts     # Smart news search tool
```

### Scripts

```bash
npm run build     # Build TypeScript
npm run dev       # Development mode with watch
npm start         # Start built server
npm run sse       # Start SSE server on port 3100
```

### Adding New APIs

1. Add API configuration to `src/config.ts`
2. Implement API-specific request logic in `src/tools/newsSearch.ts`
3. Add environment variable to `.env.example`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Xingyu Chen**
- 🌐 Website: [GitHub Profile](https://github.com/guangxiangdebizi/)
- 📧 Email: guangxiangdebizi@gmail.com
- 💼 LinkedIn: [Xingyu Chen](https://www.linkedin.com/in/xingyu-chen-b5b3b0313/)
- 📦 NPM: [@xingyuchen](https://www.npmjs.com/~xingyuchen)

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) for the amazing MCP framework
- All the news API providers for their generous free tiers
- The open-source community for inspiration and support

---

**⭐ If this project helped you, please give it a star!**