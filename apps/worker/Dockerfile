FROM node:20-alpine AS base
WORKDIR /app

COPY ../../package.json ../../pnpm-workspace.yaml ./
COPY ../../packages ./packages
COPY ./package.json ./tsconfig.json ./src ./

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm i --prod --filter @nsm/worker... --filter @nsm/core... --filter @nsm/db...
RUN pnpm --filter @nsm/worker build

CMD ["node", "dist/index.js"]

