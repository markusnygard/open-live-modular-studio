FROM node:23-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3200
CMD ["pnpm", "exec", "vite", "--host", "0.0.0.0", "--port", "3200"]
