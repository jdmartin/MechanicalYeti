FROM docker.io/library/node:lts-slim
ENV NODE_ENV=production

# Built 26 Mar 2026

WORKDIR /app

COPY . .

RUN npm ci --omit-dev

RUN mkdir -p /app/db

CMD ["node", "index.js"]
