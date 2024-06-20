FROM oven/bun
WORKDIR /app

COPY package*.json ./
COPY bun.lockb .

RUN bun install

COPY . .

ENV ELASTIC_CONNECTION_STRING=elastic_db
CMD ["bun", "run", "index.ts"]