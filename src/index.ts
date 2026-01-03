/**
 * Linkdinger - A Telegram bot for saving links to Linkding
 *
 * Entry point for the application
 */

import { bot } from "./bot";
import { config } from "./config";
import { linkding } from "./linkding";

async function main() {
  console.log("🔖 Linkdinger starting...");
  console.log(`📡 Connecting to Linkding at ${config.linkding.url}`);

  // Test Linkding connection
  const isConnected = await linkding.testConnection();
  if (!isConnected) {
    console.error("❌ Failed to connect to Linkding. Check your configuration.");
    process.exit(1);
  }
  console.log("✅ Successfully connected to Linkding");

  // Start the bot
  console.log("🤖 Starting Telegram bot...");

  if (config.allowedUsers.length > 0) {
    console.log(`🔒 Restricted to users: ${config.allowedUsers.join(", ")}`);
  } else {
    console.log("🔓 No user restrictions configured");
  }

  // Use long polling
  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot @${botInfo.username} is running!`);
      console.log("📝 Send /start to the bot to get started");
    },
  });
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  bot.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n👋 Shutting down...");
  bot.stop();
  process.exit(0);
});

// Start the application
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

