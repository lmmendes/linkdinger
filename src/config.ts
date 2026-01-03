/**
 * Application configuration loaded from environment variables
 */

function getEnvVar(name: string, required: true): string;
function getEnvVar(name: string, required?: false): string | undefined;
function getEnvVar(name: string, required = false): string | undefined {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  telegram: {
    botToken: getEnvVar("LINKDING_TELEGRAM_BOT_TOKEN", true),
  },
  linkding: {
    url: getEnvVar("LINKDING_URL", true).replace(/\/$/, ""), // Remove trailing slash
    apiToken: getEnvVar("LINKDING_API_TOKEN", true),
  },
  // Optional: Restrict bot to specific users (comma-separated Telegram user IDs)
  allowedUsers: getEnvVar("LINKDING_ALLOWED_USERS")
    ?.split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)) ?? [],
} as const;

export type Config = typeof config;

