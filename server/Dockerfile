# Multi-stage build for storm-hub Node.js backend
# Build context: repository root (to access data/zhcn and src/data/franchise.json)

# Stage 1: Build stage with native dependencies
FROM node:20-slim AS builder

WORKDIR /build

# Use Tencent Cloud mirrors for faster apt operations in China
RUN if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i 's|deb.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list.d/debian.sources && \
      sed -i 's|security.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list.d/debian.sources; \
    fi && \
    if [ -f /etc/apt/sources.list ]; then \
      sed -i 's|deb.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list && \
      sed -i 's|security.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list; \
    fi

# Install build tools for better-sqlite3 native compilation
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better layer caching
COPY server/package*.json ./

# Install dependencies (including devDependencies for tsx)
# Build better-sqlite3 from source to match container glibc version
# (prebuilt binaries may target newer glibc than node:20-slim bookworm)
RUN npm ci --build-from-source

# Copy application source AFTER npm ci to avoid overwriting container-built node_modules
# Do NOT copy server/ wholesale - it would include host node_modules built with different glibc
COPY server/src ./src
COPY server/tsconfig.json ./tsconfig.json

# Copy required data from repo root
COPY data/zhcn /workspace/data/zhcn
COPY src/data/franchise.json /workspace/src/data/franchise.json

# Stage 2: Runtime stage
FROM node:20-slim

WORKDIR /app

# Use Tencent Cloud mirrors for faster apt operations in China
RUN if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i 's|deb.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list.d/debian.sources && \
      sed -i 's|security.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list.d/debian.sources; \
    fi && \
    if [ -f /etc/apt/sources.list ]; then \
      sed -i 's|deb.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list && \
      sed -i 's|security.debian.org|mirrors.cloud.tencent.com|g' /etc/apt/sources.list; \
    fi

# Install runtime dependencies for better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy node_modules and application from builder
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package*.json ./
COPY --from=builder /build/src ./src
COPY --from=builder /build/tsconfig.json ./tsconfig.json

# Copy required data directories to match expected paths
COPY --from=builder /workspace/data /workspace/data
COPY --from=builder /workspace/src /workspace/src

# Create data directory for SQLite database
RUN mkdir -p data && \
    chown -R node:node /app /workspace

# Switch to non-root user
USER node

# Expose port (will be bound to localhost on host via compose)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the application
CMD ["npm", "start"]
