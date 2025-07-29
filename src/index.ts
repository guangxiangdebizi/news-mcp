import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Import business tools
import { newsSearch } from "./tools/newsSearch.js";
import { hasConfiguredAPIs, getActiveAPIs } from "./config.js";

// Create MCP server
const server = new Server({
  name: "news-mcp",
  version: "1.0.0",
  description: "Smart news search MCP server with automatic API switching for reliable news fetching"
}, {
  capabilities: { tools: {} }
});

// 🔸 Tool registration
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: newsSearch.name,
        description: newsSearch.description,
        inputSchema: newsSearch.parameters
      }
    ]
  };
});

// 🔸 Tool call handling
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "search_news":
      return await newsSearch.run(request.params.arguments as { query: string; language?: string; limit?: number });
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Server startup
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log startup information
    console.error("🚀 News MCP Server started successfully!");
    
    if (hasConfiguredAPIs()) {
      const activeAPIs = getActiveAPIs();
      console.error(`📡 Active APIs: ${activeAPIs.map(api => api.name).join(', ')}`);
      console.error(`🔄 Smart switching enabled with ${activeAPIs.length} API(s)`);
    } else {
      console.error("⚠️  No API keys configured. Please add API keys to .env file.");
    }
    
  } catch (error) {
    console.error("❌ Failed to start News MCP Server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error("\n🛑 News MCP Server shutting down...");
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error("\n🛑 News MCP Server terminated...");
  process.exit(0);
});

main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});