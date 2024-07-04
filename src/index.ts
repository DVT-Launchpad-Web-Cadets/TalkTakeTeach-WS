import { chromium } from "playwright";
import { ProductInterface } from "./models/models";
import base64 from "base-64";
import winston from "winston";

const { combine, timestamp, json, errors } = winston.format;

const logger = winston.createLogger({
  level: "info",
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [new winston.transports.Console()],
});

(async () => {
  logger.info("Setting up web scraper");

  await checkAndCreateIndex();

  const scrapedProducts: ProductInterface[] = [];
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const url =
    process.env.PAGE_URL ??
    "https://www.takealot.com/all?sort=Relevance%EF%BB%BF%EF%BB%BF";

  try {
    await page.goto(url);
    await page.waitForTimeout(5000);

    const products = await page.locator("div.product-card").all();

    if (!products) {
      logger.error("No products found");
      throw new Error("No products found");
    }

    const sizes = await page.evaluate(() => {
      const browserHeight = window.innerHeight;
      const pageHeight = document.body.scrollHeight;

      return { browserHeight, pageHeight };
    });

    for (let i = 0; i < sizes.pageHeight; i += 100) {
      await page.mouse.wheel(0, i);
      await page.waitForTimeout(1);
    }

    for (const product of products) {
      const name = await product.locator("h4").innerText();
      const imageUrl = await product
        .locator("div.image-box img")
        .getAttribute("src");
      const productLink =
        "https://www.takealot.com" +
        (await product.locator("> a").getAttribute("href"));
      const price = parseInt(
        (await product.locator("div.card-section ul li").last().innerText())
          .split(" ")
          .reverse()[0]
      );

      const productObject: ProductInterface = {
        name: { input: [name] },
        imageUrl: imageUrl ?? "",
        productLink,
        price,
      };

      if ((await product.locator("div.card-section ul li").count()) > 1) {
        productObject.salePrice = parseInt(
          (await product.locator("div.card-section ul li").first().innerText())
            .split(" ")
            .reverse()[0]
        );
      }

      if ((await product.locator("a > span").count()) >= 1) {
        productObject.brand = await product.locator("a > span").innerText();
        productObject.brandLink =
          "https://www.takealot.com" +
          (await product
            .locator("a > span")
            .locator("..")
            .getAttribute("href"));
      }

      if ((await product.locator("div.rating").count()) >= 1) {
        const ratingAndReviews = (
          await product.locator("div.rating > div").first().innerText()
        )
          .trim()
          .split("(");
        productObject.rating = parseFloat(ratingAndReviews[0].slice(0, -1));
        productObject.numberOfReviews = parseFloat(
          ratingAndReviews[1].slice(0, -1)
        );
      }

      scrapedProducts.push(productObject);
    }

    for (const scrapedProduct of scrapedProducts) {
      const url = scrapedProduct.productLink;
      const regex = /PLID(\d+)/;
      const match = url.match(regex);
      const plid = match ? match[1] : "0";

      const productUrl =
        `${process.env.ELASTIC_URL}/products/_doc/${plid}` ||
        `https://elasticsearch:9200/products/_doc/${plid}`;

      fetch(productUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${base64.encode(
            `${process.env.ELASTIC_USERNAME}:${process.env.ELASTIC_PASSWORD}`
          )}`,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })
        .then((resp) => {
          logger.info(resp.headers);
          if (!resp.ok && resp.status !== 404) {
            logger.error(resp);
            throw new Error(`HTTP error! status: ${resp.status}`);
          }
          return resp.json();
        })
        .then((res) => {
          const method = res.found ? "PUT" : "POST";
          return fetch(productUrl, {
            method,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${base64.encode(
                `${process.env.ELASTIC_USERNAME}:${process.env.ELASTIC_PASSWORD}`
              )}`,
            },
            tls: {
              rejectUnauthorized: false,
            },
            body: JSON.stringify(scrapedProduct),
          });
        })
        .then((resp) => {
          logger.info(resp.headers);
          if (!resp.ok) {
            logger.error(resp);
            throw new Error(`HTTP error! status: ${resp.status}`);
          }
          return resp.json();
        })
        .then((res) => logger.info(res.headers))
        .catch((err) => logger.error(err));
    }
  } catch (error) {
    logger.error(error);
  } finally {
    await browser.close();
    logger.info("Web scraping ended X_X");
  }
})();

async function checkAndCreateIndex() {
  const indexUrl = process.env.ELASTIC_URL
    ? `${process.env.ELASTIC_URL}/products`
    : "https://elasticsearch:9200/products";
  const indexMapping = {
    mappings: {
      properties: {
        name: {
          type: "completion",
        },
        imageUrl: {
          type: "text",
        },
        productLink: {
          type: "text",
        },
        price: {
          type: "float",
        },
        salePrice: {
          type: "integer",
        },
        brand: {
          type: "text",
        },
        brandLink: {
          type: "text",
        },
        rating: {
          type: "float",
        },
        numberOfReviews: {
          type: "integer",
        },
      },
    },
  };

  try {
    const response = await fetch(indexUrl, {
      method: "HEAD",
      headers: {
        Authorization: `Basic ${base64.encode(
          `${process.env.ELASTIC_USERNAME}:${process.env.ELASTIC_PASSWORD}`
        )}`,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    logger.info(response);

    if (response.status === 404) {
      logger.info("Creating products index...");

      const createResponse = await fetch(indexUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${base64.encode(
            `${process.env.ELASTIC_USERNAME}:${process.env.ELASTIC_PASSWORD}`
          )}`,
        },
        tls: {
          rejectUnauthorized: false,
        },
        body: JSON.stringify(indexMapping),
      });

      logger.info(createResponse);

      if (!createResponse.ok) {
        logger.error(createResponse);
        throw new Error(
          `Failed to create index! status: ${createResponse.status}`
        );
      }
      logger.info("Products index created successfully.");
    } else {
      logger.info("Products index already exists.");
    }
  } catch (err) {
    logger.error(err);
  }
}
