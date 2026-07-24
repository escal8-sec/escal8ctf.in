# Stage 1: Build static assets and compile TypeScript server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy project manifest and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build targets
COPY . .

# Performs full React static asset production build and esbuilds server.ts to dist/server.cjs
RUN npm run build

# Stage 2: Clean, secure production runner image
FROM node:20-alpine

WORKDIR /app

# Copy final package manifests and install only production dependencies (Express, etc)
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled resources from builder
COPY --from=builder /app/dist ./dist

# Initialize empty database file on the runner
RUN echo '{"challenges": [], "submissions": []}' > /app/database.json

EXPOSE 3000
ENV NODE_ENV=production

# Run compiled backend
CMD ["npm", "start"]
