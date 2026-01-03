/**
 * Telegram Bot implementation using grammY
 */

import { Bot, Context, GrammyError, HttpError } from "grammy";
import { config } from "./config";
import { linkding, type CreateBookmarkPayload } from "./linkding";

// URL regex pattern to extract URLs from messages
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;

// Create the bot instance
export const bot = new Bot(config.telegram.botToken);

/**
 * Check if a user is allowed to use the bot
 */
function isUserAllowed(userId: number): boolean {
  if (config.allowedUsers.length === 0) {
    return true; // No restrictions if ALLOWED_USERS is empty
  }
  return config.allowedUsers.includes(userId);
}

/**
 * Middleware to check user authorization
 */
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (userId && !isUserAllowed(userId)) {
    await ctx.reply("⛔ Sorry, you are not authorized to use this bot.");
    return;
  }
  await next();
});

/**
 * /start command - Welcome message
 */
bot.command("start", async (ctx) => {
  const welcomeMessage = `
🔖 *Welcome to Linkdinger!*

I help you save links to your Linkding instance.

*How to use:*
• Send me any URL to save it as a bookmark
• Add tags by including #hashtags in your message
• Add notes by including text after the URL

*Commands:*
/start - Show this welcome message
/help - Show detailed help
/recent - Show your 5 most recent bookmarks
/search <query> - Search your bookmarks
/tags - List your tags
/status - Check connection status

*Examples:*
\`https://example.com\`
\`https://example.com #tech #reading\`
\`https://example.com Great article about TypeScript #programming\`
  `.trim();

  await ctx.reply(welcomeMessage, { parse_mode: "Markdown" });
});

/**
 * /help command - Detailed help
 */
bot.command("help", async (ctx) => {
  const helpMessage = `
📚 *Linkdinger Help*

*Saving Links:*
Simply send me a URL and I'll save it to Linkding. The title and description will be automatically fetched from the webpage.

*Adding Tags:*
Include hashtags in your message to add tags:
\`https://example.com #tech #tutorial\`

*Adding Notes:*
Any text that isn't a URL or hashtag becomes the note:
\`https://example.com This is a great resource #learning\`

*Commands:*
• /recent - Show 5 most recent bookmarks
• /search <query> - Search bookmarks
• /tags - List all your tags
• /status - Check Linkding connection

*Tips:*
• You can send multiple URLs in one message
• Existing URLs will be updated instead of duplicated
  `.trim();

  await ctx.reply(helpMessage, { parse_mode: "Markdown" });
});

/**
 * /status command - Check connection to Linkding
 */
bot.command("status", async (ctx) => {
  await ctx.reply("🔍 Checking connection to Linkding...");

  try {
    const isConnected = await linkding.testConnection();
    if (isConnected) {
      await ctx.reply(
        `✅ *Connected to Linkding*\n\nInstance: \`${config.linkding.url}\``,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply("❌ Failed to connect to Linkding. Check your configuration.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await ctx.reply(`❌ Error: ${message}`);
  }
});

/**
 * /recent command - Show recent bookmarks
 */
bot.command("recent", async (ctx) => {
  try {
    const response = await linkding.listBookmarks({ limit: 5 });

    if (response.results.length === 0) {
      await ctx.reply("📭 No bookmarks found.");
      return;
    }

    let message = "📚 *Recent Bookmarks:*\n\n";
    for (const bookmark of response.results) {
      const title = bookmark.title || bookmark.url;
      const tags =
        bookmark.tag_names.length > 0
          ? ` ${bookmark.tag_names.map((t) => `#${t}`).join(" ")}`
          : "";
      message += `• [${escapeMarkdown(title)}](${bookmark.url})${tags}\n`;
    }

    await ctx.reply(message, {
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await ctx.reply(`❌ Error fetching bookmarks: ${message}`);
  }
});

/**
 * /search command - Search bookmarks
 */
bot.command("search", async (ctx) => {
  const query = ctx.match;

  if (!query) {
    await ctx.reply("Please provide a search query: `/search <query>`", {
      parse_mode: "Markdown",
    });
    return;
  }

  try {
    const response = await linkding.listBookmarks({ q: query, limit: 10 });

    if (response.results.length === 0) {
      await ctx.reply(`🔍 No bookmarks found for "${query}"`);
      return;
    }

    let message = `🔍 *Search results for "${escapeMarkdown(query)}":*\n\n`;
    for (const bookmark of response.results) {
      const title = bookmark.title || bookmark.url;
      const tags =
        bookmark.tag_names.length > 0
          ? ` ${bookmark.tag_names.map((t) => `#${t}`).join(" ")}`
          : "";
      message += `• [${escapeMarkdown(title)}](${bookmark.url})${tags}\n`;
    }

    await ctx.reply(message, {
      parse_mode: "Markdown",
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await ctx.reply(`❌ Error searching bookmarks: ${message}`);
  }
});

/**
 * /tags command - List all tags
 */
bot.command("tags", async (ctx) => {
  try {
    const response = await linkding.listTags({ limit: 50 });

    if (response.results.length === 0) {
      await ctx.reply("🏷️ No tags found.");
      return;
    }

    const tagsList = response.results.map((t) => `#${t.name}`).join("  ");
    await ctx.reply(`🏷️ *Your Tags:*\n\n${tagsList}`, {
      parse_mode: "Markdown",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await ctx.reply(`❌ Error fetching tags: ${message}`);
  }
});

/**
 * Handle text messages - Extract and save URLs
 */
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const urls = text.match(URL_REGEX);

  if (!urls || urls.length === 0) {
    await ctx.reply(
      "🤔 I couldn't find any URLs in your message. Send me a link to save it!"
    );
    return;
  }

  // Extract hashtags for tags
  const hashtagRegex = /#(\w+)/g;
  const hashtags: string[] = [];
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }

  // Extract notes (everything that's not a URL or hashtag)
  let notes = text;
  for (const url of urls) {
    notes = notes.replace(url, "");
  }
  notes = notes.replace(/#\w+/g, "").trim();

  // Process each URL
  for (const url of urls) {
    await processUrl(ctx, url, hashtags, notes);
  }
});

/**
 * Process and save a single URL
 */
async function processUrl(
  ctx: Context,
  url: string,
  tags: string[],
  notes: string
): Promise<void> {
  try {
    // Check if URL already exists
    const checkResult = await linkding.checkBookmark(url);

    if (checkResult.bookmark) {
      // URL already exists - update it with new tags if provided
      const existingTags = checkResult.bookmark.tag_names;
      const newTags = [...new Set([...existingTags, ...tags])];

      if (tags.length > 0 || notes) {
        await linkding.updateBookmark(checkResult.bookmark.id, {
          tag_names: newTags,
          notes: notes || checkResult.bookmark.notes,
        });

        await ctx.reply(
          `🔄 *Updated existing bookmark:*\n\n[${escapeMarkdown(checkResult.bookmark.title || url)}](${url})\n\nTags: ${newTags.map((t) => `#${t}`).join(" ") || "none"}`,
          { parse_mode: "Markdown", link_preview_options: { is_disabled: true } }
        );
      } else {
        await ctx.reply(
          `ℹ️ *Already bookmarked:*\n\n[${escapeMarkdown(checkResult.bookmark.title || url)}](${url})\n\nTags: ${existingTags.map((t) => `#${t}`).join(" ") || "none"}`,
          { parse_mode: "Markdown", link_preview_options: { is_disabled: true } }
        );
      }
      return;
    }

    // Create new bookmark
    const payload: CreateBookmarkPayload = {
      url,
      tag_names: tags.length > 0 ? tags : checkResult.auto_tags,
      notes: notes || undefined,
    };

    const bookmark = await linkding.createBookmark(payload);
    const tagDisplay =
      bookmark.tag_names.length > 0
        ? bookmark.tag_names.map((t) => `#${t}`).join(" ")
        : "none";

    await ctx.reply(
      `✅ *Saved!*\n\n[${escapeMarkdown(bookmark.title || url)}](${url})\n\nTags: ${tagDisplay}`,
      { parse_mode: "Markdown", link_preview_options: { is_disabled: true } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await ctx.reply(`❌ Failed to save ${url}\n\nError: ${message}`);
  }
}

/**
 * Escape special characters for Telegram Markdown
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

/**
 * Error handler
 */
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);

  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

