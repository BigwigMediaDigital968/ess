# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy deps first for cache maximization
COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://ess.bigwigmediadigital.com:3434/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ---------- Serve stage ----------
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Modify permissions to allow non-root nginx to run
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Run as non-root
USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
