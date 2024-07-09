import { chromium } from "playwright";
import { ProductResponseInterface } from "./models/models";
import base64 from "base-64";
import winston from "winston";

const { combine, timestamp, json, errors } = winston.format;

const logger = winston.createLogger({
  level: "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [new winston.transports.Console()],
});

(async () => {
  logger.info("Deleting products");
  const products = await getProducts();

  if (!products) {
    logger.error("No products found.");
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();

  for (const product of products) {
    const url = product.productLink;
    const page = await context.newPage();

    try {
      await page.goto(url);
      const heading = await page.locator("h1").innerText();

      if (heading.includes("Oops")) {
        deleteProduct(product.id ?? "");
      }
    } catch (error) {
      logger.error(`Error processing ${product.name}:`, error);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})();

async function getProducts() {
  return fetch(
    `${process.env.ELASTIC_URL}/products/_search` ||
      "https://elasticsearch:9200/products/_search",
    {
      method: "post",
      headers: {
        Authorization: `Basic ${base64.encode(
          `${process.env.ELASTIC_USERNAME}:${process.env.ELASTIC_PASSWORD}`
        )}`,
        "Content-Type": "application/json",
      },
      tls: {
        rejectUnauthorized: false,
      },
      body: JSON.stringify({
        size: 10000,
        query: {
          match_all: {},
        },
      }),
    }
  )
    .then((resp) => {
      logger.info(resp.headers);
      return resp.json();
    })
    .then((res: ProductResponseInterface) =>
      res.hits.hits.map((hit) => {
        hit._source.id = hit._id;
        return hit._source;
      })
    )
    .catch((err) => {
      logger.error(err.message);
    });
}

async function deleteProduct(id: string) {
  return fetch(
    `${process.env.ELASTIC_URL}/products/_doc/${id}` ||
      `https://elasticsearch:9200/products/_doc/${id}`,
    {
      method: "delete",
      headers: {
        Authorization: `Basic ${base64.encode(
          `${process.env.ELASTIC_USERNAME}:${process.env.ELASTIC_PASSWORD}`
        )}`,
        "Content-Type": "application/json",
      },
      tls: {
        rejectUnauthorized: false,
      },
    }
  )
    .then((resp) => {
      logger.info(resp.headers);
      resp.json();
    })
    .then((res) => {
      logger.info(res);
    })
    .catch((err) => {
      logger.error(err.message);
    });
}
