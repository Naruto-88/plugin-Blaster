FROM node:20-alpine AS base
WORKDIR /app

COPY ../../package.json ../../pnpm-workspace.yaml ./
COPY ../../packages ./packages
COPY ./package.json ./next.config.mjs ./tsconfig.json ./postcss.config.js ./tailwind.config.ts ./app ./components ./public ./

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
RUN pnpm i --prod --filter @nsm/web... --filter @nsm/core... --filter @nsm/db...
RUN pnpm --filter @nsm/web build

EXPOSE 3000
CMD ["pnpm", "--filter", "@nsm/web", "start"]

