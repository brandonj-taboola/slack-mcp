# Slack MCP Server

A Model Context Protocol (MCP) server that connects Claude Desktop to Slack. Authenticate with your Slack account and let Claude read channels, post messages, search, react, and more - all as you.

## Features

- **OAuth Authentication** - Secure login with your Slack account (no shared tokens)
- **Read Access** - List channels, read messages, search, view files
- **Write Access** - Post messages, reply to threads, add reactions
- **User Context** - See everything you can see in Slack, act as yourself
- **Token Persistence** - Authenticate once, token saved for future sessions

## Available Tools

| Tool | Description |
|------|-------------|
| `list_channels` | List all channels you have access to |
| `get_channel_messages` | Read messages from a channel |
| `post_message` | Send a message to a channel or thread |
| `search_messages` | Search for messages across Slack |
| `get_thread_replies` | Get all replies in a thread |
| `add_reaction` | Add an emoji reaction to a message |
| `list_users` | List all users in the workspace |
| `get_user_info` | Get details about a specific user |
| `list_files` | List files shared in Slack |
| `get_file_info` | Get details about a specific file |
| `summarize_channel` | Fetch all messages from a channel by name |
| `slack_reauth` | Re-authenticate (switch accounts or refresh token) |

## Prerequisites

- Node.js 20.x or later
- A Slack workspace where you can install apps
- Claude Desktop
- mkcert (for local SSL certificates)

## Setup Instructions

### Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** > **From scratch**
3. Name it (e.g., "Claude Slack MCP") and select your workspace
4. Under **OAuth & Permissions**, add these **User Token Scopes**:

| Scope | Purpose |
|-------|---------|
| `channels:read` | List public channels |
| `groups:read` | List private channels |
| `channels:history` | Read public channel messages |
| `groups:history` | Read private channel messages |
| `im:read` | List direct messages |
| `im:history` | Read DM content |
| `mpim:read` | List group DMs |
| `mpim:history` | Read group DM content |
| `chat:write` | Post messages |
| `users:read` | Get user info |
| `reactions:read` | Read emoji reactions |
| `reactions:write` | Add emoji reactions |
| `files:read` | View shared files |
| `files:write` | Upload files |
| `search:read` | Search messages |

5. Under **OAuth & Permissions** > **Redirect URLs**, add:
   ```
   https://localhost:8435/callback
   ```

6. Click **Save URLs**

7. Note your **Client ID** and **Client Secret** from **Basic Information** > **App Credentials**

### Step 2: Install SSL Certificates

Slack requires HTTPS for OAuth redirects. Use mkcert to create trusted local certificates.

#### Windows

```powershell
# Install mkcert (requires Chocolatey)
choco install mkcert -y

# Install the local certificate authority
mkcert -install

# Generate certificates in the project directory
cd "C:\path\to\slack-mcp"
mkcert localhost 127.0.0.1
```

#### macOS

```bash
# Install mkcert (requires Homebrew)
brew install mkcert

# Install the local certificate authority
mkcert -install

# Generate certificates in the project directory
cd /path/to/slack-mcp
mkcert localhost 127.0.0.1
```

#### Linux

```bash
# Install mkcert
# Debian/Ubuntu:
sudo apt install mkcert
# Arch:
sudo pacman -S mkcert

# Install the local certificate authority
mkcert -install

# Generate certificates in the project directory
cd /path/to/slack-mcp
mkcert localhost 127.0.0.1
```

This creates two files in your project directory:
- `localhost+1.pem` (certificate)
- `localhost+1-key.pem` (private key)

### Step 3: Install Dependencies and Build

```bash
cd /path/to/slack-mcp
npm install
npm run build
```

### Step 4: Configure Claude Desktop

#### Windows

Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["C:\\path\\to\\slack-mcp\\build\\index.js"],
      "env": {
        "SLACK_CLIENT_ID": "your-client-id",
        "SLACK_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

#### macOS

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slack": {
      "command": "node",
      "args": ["/path/to/slack-mcp/build/index.js"],
      "env": {
        "SLACK_CLIENT_ID": "your-client-id",
        "SLACK_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

Replace:
- `/path/to/slack-mcp` with the actual path to this project
- `your-client-id` with your Slack App's Client ID
- `your-client-secret` with your Slack App's Client Secret

### Step 5: Restart Claude Desktop

Close and reopen Claude Desktop to load the new configuration.

### Step 6: Authenticate

The first time you use a Slack tool in Claude Desktop:

1. Claude will start the MCP server
2. Your browser will open to Slack's authorization page
3. Click **Allow** to authorize the app
4. You'll see "Authorization Successful!" - close the browser tab
5. Claude will complete your request

Your token is saved to `.slack-token.json` for future sessions.

## Usage Examples

Once configured, you can ask Claude things like:

- "List my Slack channels"
- "Show me the last 10 messages in #general"
- "Post 'Hello team!' to #random"
- "Search Slack for messages about the quarterly report"
- "Add a thumbsup reaction to the last message"
- "Who is @john.smith on Slack?"

## Tool Reference

### `list_channels`
List all Slack channels you have access to.

**Parameters:**
- `limit` (optional): Number of channels to return (1-200, default: 100)
- `types` (optional): Channel types to include (default: `public_channel,private_channel`)
  - Options: `public_channel`, `private_channel`, `mpim`, `im`

### `get_channel_messages`
Fetch messages from a specific channel.

**Parameters:**
- `channel_id` (required): The channel ID (e.g., `C1234567890`)
- `limit` (optional): Number of messages (1-100, default: 50)
- `fetch_all` (optional): Fetch all messages with pagination (default: false)

### `post_message`
Post a message to a channel.

**Parameters:**
- `channel_id` (required): The channel ID to post to
- `text` (required): The message text
- `thread_ts` (optional): Thread timestamp to reply to

### `search_messages`
Search for messages across Slack.

**Parameters:**
- `query` (required): The search query
- `count` (optional): Number of results (1-100, default: 20)

### `get_thread_replies`
Get all replies in a message thread.

**Parameters:**
- `channel_id` (required): The channel containing the thread
- `thread_ts` (required): The parent message timestamp

### `add_reaction`
Add an emoji reaction to a message.

**Parameters:**
- `channel_id` (required): The channel containing the message
- `timestamp` (required): The message timestamp
- `emoji` (required): Emoji name without colons (e.g., `thumbsup`)

### `list_users`
List all users in the workspace.

**Parameters:**
- `limit` (optional): Number of users (1-200, default: 100)

### `get_user_info`
Get information about a specific user.

**Parameters:**
- `user_id` (required): The user ID (e.g., `U1234567890`)

### `list_files`
List files shared in Slack.

**Parameters:**
- `channel_id` (optional): Filter to a specific channel
- `user_id` (optional): Filter by uploader
- `types` (optional): File types (`images`, `pdfs`, `snippets`, `gdocs`, `zips`, `all`)
- `count` (optional): Number of files (1-100, default: 20)

### `get_file_info`
Get detailed information about a file.

**Parameters:**
- `file_id` (required): The file ID (e.g., `F1234567890`)

### `summarize_channel`
Fetch all messages from a channel for summarization.

**Parameters:**
- `channel_name` (required): Channel name with or without `#` prefix

### `slack_reauth`
Force re-authentication with Slack. Use this to switch accounts or if your token has expired.

**Parameters:** None

## Troubleshooting

### "SSL certificates not found"

Make sure you've run `mkcert localhost 127.0.0.1` in the project directory and the `.pem` files exist.

### "SLACK_CLIENT_ID and SLACK_CLIENT_SECRET environment variables are required"

Check that your Claude Desktop config has the correct `env` section with both values.

### "invalid_redirect_uri" error from Slack

Ensure the redirect URL in your Slack App exactly matches:
```
https://localhost:8435/callback
```

### Browser doesn't open for authentication

Check the Claude Desktop logs. If the browser can't open automatically, the URL will be printed - copy and paste it manually.

### Token expired or want to switch accounts

Ask Claude to use the `slack_reauth` tool, or delete `.slack-token.json` from the project directory and restart Claude Desktop.

### "missing_scope" error

Add all required scopes to your Slack App under **OAuth & Permissions** > **User Token Scopes**.

## Security Notes

- Your Slack token is stored locally in `.slack-token.json` (not synced or shared)
- The Client Secret should be kept private - don't commit it to version control
- SSL certificates are local to your machine
- All Slack API calls are made with your user identity

## File Structure

```
slack-mcp/
├── src/
│   └── index.ts          # Main server code
├── build/
│   └── index.js          # Compiled JavaScript
├── localhost+1.pem       # SSL certificate (generated)
├── localhost+1-key.pem   # SSL private key (generated)
├── .slack-token.json     # Saved OAuth token (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Watch mode (recompile on changes)
npm run dev

# Build once
npm run build

# Run directly (for testing)
SLACK_CLIENT_ID=xxx SLACK_CLIENT_SECRET=yyy npm start
```

## License

MIT
