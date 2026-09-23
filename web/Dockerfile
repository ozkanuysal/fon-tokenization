# Built from the repo root, because the app reads ../deployments at build time:
#   docker build -f web/Dockerfile .
FROM node:24-slim AS build

RUN corepack enable

WORKDIR /repo/web
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY web/ ./
COPY deployments/ ../deployments/

ARG VITE_NETWORK=local
ARG VITE_BACKEND_URL=http://localhost:8000
RUN VITE_NETWORK=$VITE_NETWORK VITE_BACKEND_URL=$VITE_BACKEND_URL pnpm build


FROM nginx:1.29-alpine

COPY --from=build /repo/web/dist /usr/share/nginx/html
