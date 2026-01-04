# Linkdinger

A Telegram bot that saves links directly to your [Linkding](https://github.com/sissbruecker/linkding) bookmark manager.

## Features

- Send any URL to save it as a bookmark
- Add tags using #hashtags
- Include notes with your bookmarks
- Search your bookmarks directly from Telegram
- View recent bookmarks
- Auto-detects duplicate URLs and updates them
- Optional user restrictions

## Prerequisites

- A running [Linkding](https://github.com/sissbruecker/linkding) instance
- A Telegram bot token (get one from [@BotFather](https://t.me/BotFather))
- [Bun](https://bun.sh) runtime (only for local development) or Docker

## Quick Start with Docker

Docker images are published to [Docker Hub](https://hub.docker.com/r/lmmendes/linkdinger) and (GitHub Packages)[https://github.com/lmmendes/linkdinger/pkgs/container/linkdinger].

### Using Docker Compose (Recommended)

1. Clone this repository:
   ```bash
   git clone https://github.com/lmmendes/linkdinger.git
   cd linkdinger
   ```

2. Create a `.env` file with your configuration:
   ```bash
   LINKDING_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   LINKDING_URL=https://linkding.example.com
   LINKDING_API_TOKEN=your_linkding_api_token
   LINKDING_ALLOWED_USERS=  # Optional: comma-separated Telegram user IDs
   ```

3. Start the bot:
   ```bash
   docker compose up -d
   ```

### Using Docker directly

```bash
docker build -t linkdinger .

docker run -d \
  --name linkdinger \
  --restart unless-stopped \
  -e LINKDING_TELEGRAM_BOT_TOKEN=your_token \
  -e LINKDING_URL=https://linkding.example.com \
  -e LINKDING_API_TOKEN=your_linkding_token \
  linkdinger
```

## Local Development

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set environment variables:
   ```bash
   export LINKDING_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   export LINKDING_URL=https://linkding.example.com
   export LINKDING_API_TOKEN=your_linkding_api_token
   ```

3. Run the bot:
   ```bash
   bun run dev
   ```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `LINKDING_TELEGRAM_BOT_TOKEN` | ✅ | Your Telegram bot token from @BotFather |
| `LINKDING_URL` | ✅ | URL of your Linkding instance (e.g., `https://linkding.example.com`) |
| `LINKDING_API_TOKEN` | ✅ | API token from Linkding (Settings → Integrations) |
| `LINKDING_ALLOWED_USERS` | ❌ | Comma-separated list of Telegram user IDs allowed to use the bot. Leave empty to allow everyone. |

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Show welcome message and quick guide |
| `/help` | Show detailed help |
| `/recent` | Display 5 most recent bookmarks |
| `/search <query>` | Search your bookmarks |
| `/tags` | List all your tags |
| `/status` | Check connection to Linkding |

## Usage Examples

### Save a simple link
```
https://example.com
```

### Save a link with tags
```
https://example.com #tech #reading
```

### Save a link with tags and notes
```
https://example.com Great article about TypeScript! #programming #tutorial
```

## Getting Your Linkding API Token

1. Open your Linkding instance
2. Go to **Settings** → **Integrations**
3. Copy the **REST API** token

## Getting Your Telegram User ID

To restrict the bot to specific users, you need their Telegram user IDs:

1. Start a chat with [@userinfobot](https://t.me/userinfobot)
2. It will reply with your user ID
3. Add this ID to the `ALLOWED_USERS` environment variable

## License

MIT
