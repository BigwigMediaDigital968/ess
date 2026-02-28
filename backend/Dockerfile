FROM node:20-alpine AS builder

# Add tini for proper signal handling in production
RUN apk add --no-cache tini openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY . .

# Generate Prisma client AFTER all files are copied so the correct schema is always used
RUN npx prisma generate


# ---------- Production stage ----------
FROM node:20-alpine AS production

RUN apk add --no-cache tini openssl

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

# Create directories and set correct ownership purely for node user
RUN mkdir -p uploads/profiles uploads/certs uploads/experience uploads/logos uploads/resumes && \
    chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 3434

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
