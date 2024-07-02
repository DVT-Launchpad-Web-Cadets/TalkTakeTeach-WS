import { chromium } from "playwright";
import { ProductInterface } from "./models/models";
import base64 from "base-64";

(async () => {
	console.log("\nSetting up web scraper\n");

	await checkAndCreateIndex();

	const scrapedProducts: ProductInterface[] = [];
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();
	const url =
		process.env.PAGE_URL ??
		"https://www.takealot.com/all?sort=Relevance%EF%BB%BF%EF%BB%BF";

	console.log("\nStarting to scrape", url);

	try {
		await page.goto(url);
        await page.waitForTimeout(5000);

		const products = await page.locator("div.product-card").all();

		if (!products) {
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
				name,
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
				`https://localhost:9200/products/_doc/${plid}`;

			fetch(productUrl, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Basic ${base64.encode(
						`elastic:${process.env.ELASTIC_PASSWORD}`
					)}`,
				},
				tls: {
					rejectUnauthorized: false,
				},
			})
				.then((resp) => {
					if (!resp.ok && resp.status !== 404) {
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
								`elastic:${process.env.ELASTIC_PASSWORD}`
							)}`,
						},
						tls: {
							rejectUnauthorized: false,
						},
						body: JSON.stringify(scrapedProduct),
					});
				})
				.then((resp) => {
					if (!resp.ok) {
						throw new Error(`HTTP error! status: ${resp.status}`);
					}
					return resp.json();
				})
				.then((res) => console.log(res))
				.catch((err) => console.error(err.message));
		}
	} catch (error) {
		console.error("Error while scraping:", error);
	} finally {
		await browser.close();
		console.log("\nWeb scraping ended X_X\n");
	}
})();

async function checkAndCreateIndex() {
	const indexUrl = process.env.ELASTIC_URL
		? `${process.env.ELASTIC_URL}/products`
		: "https://localhost:9200/products";
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
					`elastic:${process.env.ELASTIC_PASSWORD}`
				)}`,
			},
			tls: {
				rejectUnauthorized: false,
			},
		});

		if (response.status === 404) {
			console.log("Creating products index...");
			const createResponse = await fetch(indexUrl, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Basic ${base64.encode(
						`elastic:${process.env.ELASTIC_PASSWORD}`
					)}`,
				},
				tls: {
					rejectUnauthorized: false,
				},
				body: JSON.stringify(indexMapping),
			});

			if (!createResponse.ok) {
				throw new Error(
					`Failed to create index! status: ${createResponse.status}`
				);
			}

			console.log("Products index created successfully.");
		} else {
			console.log("Products index already exists.");
		}
	} catch (err) {
		console.error("Error checking or creating index:", err);
	}
}
