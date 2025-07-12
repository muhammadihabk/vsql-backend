FROM node:20.18.2-alpine
WORKDIR /app

COPY package*.json ./

COPY tsconfig.json ./

RUN npm install

COPY src/ ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
