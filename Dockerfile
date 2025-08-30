FROM node:20.18.2-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production build stage  
FROM base AS build
RUN npm ci --only=production && npm cache clean --force
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Production runtime stage
FROM node:20.18.2-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
