#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WebClient } from "@slack/web-api";
import { z } from "zod";

// Validate environment
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
if (!SLACK_BOT_TOKEN) {
  console.error("Error: SLACK_BOT_TOKEN environment variable is required");
  process.exit(1);
}

// Initialize Slack client
const slack = new WebClient(SLACK_BOT_TOKEN);

// Create MCP server
const server = new McpServer({
  name: "slack-mcp",
  version: "1.0.0",
});

// Tool: List channels
server.tool(
  "list_channels",
  {
    limit: z.number().min(1).max(200).optional().describe("Number of channels to return (default: 100)"),
  },
  async ({ limit = 100 }) => {
    try {
      const result = await slack.conversations.list({
        limit,
        exclude_archived: true,
        types: "public_channel,private_channel",
      });

      if (!result.ok || !result.channels) {
        return {
          content: [{ type: "text", text: `Slack API error: ${result.error || "Unknown error"}` }],
          isError: true,
        };
      }

      const channels = result.channels.map((ch) => ({
        id: ch.id,
        name: ch.name,
        topic: ch.topic?.value || "",
        purpose: ch.purpose?.value || "",
        is_private: ch.is_private,
        num_members: ch.num_members,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(channels, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error listing channels:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error listing channels: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Get channel messages (with pagination support)
server.tool(
  "get_channel_messages",
  {
    channel_id: z.string().describe("The Slack channel ID (e.g., C1234567890)"),
    limit: z.number().min(1).max(100).optional().describe("Number of messages to fetch (default: 50)"),
    fetch_all: z.boolean().optional().describe("Fetch all messages using pagination (default: false)"),
  },
  async ({ channel_id, limit = 50, fetch_all = false }) => {
    try {
      const allMessages: any[] = [];
      let cursor: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const result = await slack.conversations.history({
          channel: channel_id,
          limit: fetch_all ? 100 : limit,
          cursor,
        });

        if (!result.ok || !result.messages) {
          return {
            content: [{ type: "text", text: `Slack API error: ${result.error || "Unknown error"}` }],
            isError: true,
          };
        }

        const messages = result.messages.map((msg) => ({
          ts: msg.ts,
          user: msg.user,
          text: msg.text,
          thread_ts: msg.thread_ts,
          reply_count: msg.reply_count,
        }));

        allMessages.push(...messages);

        if (fetch_all && result.response_metadata?.next_cursor) {
          cursor = result.response_metadata.next_cursor;
          hasMore = true;
        } else {
          hasMore = false;
        }

        // If not fetching all, break after first batch
        if (!fetch_all) {
          break;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(allMessages, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching messages:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching messages: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Summarize channel
server.tool(
  "summarize_channel",
  {
    channel_name: z.string().describe("The Slack channel name (e.g., #nerdwallet-q3-2025-se-support)"),
  },
  async ({ channel_name }) => {
    try {
      // Remove # if present
      const cleanChannelName = channel_name.replace(/^#/, "");

      // First, find the channel
      const channelsResult = await slack.conversations.list({
        limit: 1000,
        exclude_archived: true,
        types: "public_channel,private_channel",
      });

      if (!channelsResult.ok || !channelsResult.channels) {
        return {
          content: [{ type: "text", text: `Slack API error: ${channelsResult.error || "Unknown error"}` }],
          isError: true,
        };
      }

      const channel = channelsResult.channels.find(
        (ch) => ch.name === cleanChannelName || ch.name === channel_name
      );

      if (!channel || !channel.id) {
        return {
          content: [
            {
              type: "text",
              text: `Channel "${channel_name}" not found or invalid. Available channels: ${channelsResult.channels
                .slice(0, 10)
                .map((ch) => ch.name)
                .join(", ")}...`,
            },
          ],
          isError: true,
        };
      }

      const channelId = channel.id;

      // Fetch all messages with pagination
      const allMessages: any[] = [];
      let cursor: string | undefined = undefined;
      let hasMore = true;

      while (hasMore) {
        const result = await slack.conversations.history({
          channel: channelId,
          limit: 100,
          cursor,
        });

        if (!result.ok || !result.messages) {
          return {
            content: [{ type: "text", text: `Slack API error: ${result.error || "Unknown error"}` }],
            isError: true,
          };
        }

        allMessages.push(...result.messages);

        if (result.response_metadata?.next_cursor) {
          cursor = result.response_metadata.next_cursor;
          hasMore = true;
        } else {
          hasMore = false;
        }
      }

      // Sort messages by timestamp (oldest first)
      allMessages.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));

      // Format messages for summarization
      const formattedMessages = allMessages
        .filter((msg) => msg.text && !msg.subtype) // Filter out system messages
        .map((msg) => ({
          timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
          user: msg.user || "unknown",
          text: msg.text,
          is_thread: !!msg.thread_ts,
          reply_count: msg.reply_count || 0,
        }));

      // Create summary
      const summary = {
        channel_name: channel.name || channel_name,
        channel_id: channelId,
        total_messages: formattedMessages.length,
        date_range: {
          oldest: formattedMessages[0]?.timestamp || "N/A",
          newest: formattedMessages[formattedMessages.length - 1]?.timestamp || "N/A",
        },
        messages: formattedMessages,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error summarizing channel:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error summarizing channel: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Slack MCP server running on stdio");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
