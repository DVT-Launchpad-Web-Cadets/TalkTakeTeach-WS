FROM oven/bun

WORKDIR /app

ENV ELASTIC_URL "https://elasticsearch:9200"
ENV ELASTIC_USERNAME "elastic"
ENV ELASTIC_PASSWORD "8HGdKO=3drZRL9tWb14E"
ENV PAGE_URL "https://www.takealot.com/all?sort=Relevance%EF%BB%BF%EF%BB%BF"

COPY . .

RUN bun install

RUN apt-get update && apt-get -y install \
    cron \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libdrm2 \
    libxcb1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    coreutils

RUN bun x playwright install

COPY cronjob /etc/cron.d/cronjob
COPY run-scraper.sh /app/run-scraper.sh
COPY run-delete.sh /app/run-delete.sh
COPY intial-scrape.sh /app/intial-scrape.sh

RUN chmod +x /app/run-scraper.sh
RUN chmod +x /app/run-delete.sh
RUN chmod +x /app/intial-scrape.sh

RUN chmod 0644 /etc/cron.d/cronjob
RUN crontab /etc/cron.d/cronjob

RUN touch /var/log/cron.log
RUN touch /var/log/cron.error.log

RUN printenv > /etc/environment

CMD ["/app/intial-scrape.sh","cron", "-f"]
