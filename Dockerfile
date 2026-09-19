# ---------- frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- backend ----------
FROM node:20-alpine AS backend
WORKDIR /build
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build && npm prune --omit=dev

# ---------- runtime ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY backend/package.json ./
COPY --from=backend /build/node_modules ./node_modules
COPY --from=backend /build/dist ./dist
COPY --from=frontend /build/dist ./dist/public

USER node
EXPOSE 8080
# Heroku injects $PORT at runtime; 8080 is the local default (see src/index.ts).
CMD ["node", "dist/index.js"]
