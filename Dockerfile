# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Production stage
FROM oven/bun:1 AS production

WORKDIR /app

# Create non-root user for security
RUN groupadd --system --gid 1001 botgroup && \
    useradd --system --uid 1001 --gid botgroup botuser

# Copy built application
COPY --from=builder --chown=botuser:botgroup /app/node_modules ./node_modules
COPY --from=builder --chown=botuser:botgroup /app/src ./src
COPY --from=builder --chown=botuser:botgroup /app/package.json ./

USER botuser

# Set environment variables
ENV NODE_ENV=production

# Health check - verify the process is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pgrep -f "bun" > /dev/null || exit 1

# Run the bot
CMD ["bun", "run", "src/index.ts"]

