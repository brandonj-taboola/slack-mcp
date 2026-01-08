# Slack MCP Server

A Model Context Protocol (MCP) server that connects Claude Desktop or Cursor to Slack. Authenticate with your Slack account and let Claude read channels, post messages, search, react, and more - all as you.

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

## Required Slack Scopes

The MCP server uses the following user token scopes:

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

## Setup Instructions

### Prerequisites

- Node.js 20.x or later
- Claude Desktop or Cursor
- mkcert (for local SSL certificates)
- Slack App credentials (Client ID and Client Secret) - request from project administrator

### Step 1: Clone the Project

Clone the repository to any location on your machine:

```bash
git clone https://github.com/brandonj-taboola/slack-mcp.git
cd slack-mcp
```

Note the full path to this directory - you'll need it for the editor configuration later.

### Step 2: Install SSL Certificates

Slack requires HTTPS for OAuth redirects. Use mkcert to create trusted local certificates.

#### Windows (PowerShell as Administrator)

```powershell
# Install mkcert (requires Chocolatey)
choco install mkcert -y

# Install the local certificate authority
mkcert -install

# Navigate to the project directory and generate certificates
cd C:\path\to\slack-mcp
mkcert localhost 127.0.0.1
```

#### macOS

```bash
# Install mkcert (requires Homebrew)
brew install mkcert

# Install the local certificate authority
mkcert -install

# Navigate to the project directory and generate certificates
cd /path/to/slack-mcp
mkcert localhost 127.0.0.1
```

This creates two files in your project directory:
- `localhost+1.pem` (certificate)
- `localhost+1-key.pem` (private key)

### Step 3: Install Dependencies and Build

From the project directory:

```bash
cd /path/to/slack-mcp
npm install
npm run build
```

### Step 4: Get Slack App Credentials

Request the following from your project administrator:
- Slack Client ID
- Slack Client Secret

These credentials are for the shared Slack App installed in the Taboola Workspace.

### Step 5: Configure Your Editor

#### Claude Desktop

##### Windows

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

##### macOS

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

#### Cursor

##### Windows

Edit `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`:

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

##### macOS

Edit `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`:

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

**Note:** Replace `/path/to/slack-mcp` (or `C:\path\to\slack-mcp` on Windows) with the actual path where you cloned the repository. Update the credentials with the values from your project administrator.

### Step 6: Restart Your Editor

Close and reopen Claude Desktop or Cursor to load the new configuration.

### Step 7: Authenticate

The first time you use a Slack tool:

1. Your browser will open to Slack's authorization page
2. Sign in with your Taboola Slack account
3. Click **Allow** to authorize the app
4. You'll see "Authorization Successful!" - close the browser tab
5. Return to your editor and continue

Your token is saved locally for future sessions.

## Usage Examples

Once configured, you can ask Claude things like:

- "List my Slack channels"
- "Show me the last 10 messages in #general"
- "Post 'Hello team!' to #random"
- "Search Slack for messages about the quarterly report"
- "Add a thumbsup reaction to the last message"

## Troubleshooting

### "SSL certificates not found"

Make sure you've run `mkcert localhost 127.0.0.1` in the project directory and the `.pem` files exist.

### "SLACK_CLIENT_ID and SLACK_CLIENT_SECRET environment variables are required"

Check that your editor config has the correct `env` section with both values.

### "site cannot be reached" on OAuth callback

The OAuth callback server only runs during authentication. Restart your editor and try using a Slack tool again to trigger a fresh OAuth flow.

### Token expired or want to switch accounts

Ask Claude to use the `slack_reauth` tool, or delete `.slack-token.json` from the project directory and restart your editor.

## Security Notes

- Your Slack token is stored locally in `.slack-token.json` (not synced or shared)
- The Client Secret should be kept private - don't commit it to version control
- SSL certificates are local to your machine
- All Slack API calls are made with your user identity
