# Slack MCP Server

A Model Context Protocol (MCP) server for interacting with Slack channels. This server provides tools to list channels, fetch messages, and summarize entire Slack channels.

## Features

- 📋 List Slack channels (public and private)
- 💬 Fetch channel messages with pagination support
- 📊 Summarize entire channels with full message history
- 🔄 Automatic pagination for large channels

## Prerequisites

- Node.js (version 20.19 or later)
- npm
- A Slack bot token with the required permissions

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Your Slack Bot Token

**Request the bot token from the project maintainer.** The bot token is required to authenticate with the Slack API.

### 3. Build the Project

```bash
npm run build
```

### 4. Configure in Cursor MCP

Add the Slack MCP server to your Cursor MCP configuration:

1. Open Cursor Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "MCP" in settings
3. Add this configuration:

```json
{
  "mcpServers": {
    "slack-mcp": {
      "command": "node",
      "args": ["path/to/slack-mcp/build/index.js"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token-here"
      }
    }
  }
}
```

Replace `path/to/slack-mcp` with the actual path to this project directory, and `xoxb-your-token-here` with the bot token you received from the project maintainer.

4. Restart Cursor to load the MCP server

## Available Tools

### `list_channels`
List all public and private Slack channels.

**Parameters:**
- `limit` (optional): Number of channels to return (default: 100, max: 200)

### `get_channel_messages`
Fetch messages from a specific channel.

**Parameters:**
- `channel_id` (required): The Slack channel ID (e.g., C1234567890)
- `limit` (optional): Number of messages to fetch (default: 50, max: 100)
- `fetch_all` (optional): Fetch all messages using pagination (default: false)

### `summarize_channel`
Find a channel by name and fetch all messages for summarization.

**Parameters:**
- `channel_name` (required): The Slack channel name (e.g., #nerdwallet-q3-2025-se-support)

## Required Slack Bot Scopes

The bot token must have the following OAuth scopes:

- `channels:read` - List public channels
- `groups:read` - List private channels
- `channels:history` - Read public channel message history
- `groups:history` - Read private channel message history

**Note:** Request the bot token from the project maintainer. The token should already be configured with these scopes.

## Troubleshooting

### "missing_scope" Error

If you encounter a "missing_scope" error, the bot token doesn't have the required permissions. Contact the project maintainer to ensure the token has the correct scopes.

### Channel Not Found

If a channel cannot be found, verify:
- The channel name is correct (with or without the `#` prefix)
- The bot has access to the channel
- The channel is not archived

### Token Not Working

Ensure the token is correctly set in the MCP config's `env` section (see step 4 above). The token should start with `xoxb-` and be the exact token provided by the project maintainer.

## License

See the project repository for license information.

