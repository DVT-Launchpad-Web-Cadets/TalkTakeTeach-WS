import { chromium } from "playwright";
import ProductInterface from "./models/models";
import base64 from "base-64";

(async () => {
	console.log("\nSetting up web scraper\n");

	const scrapedProducts: ProductInterface[] = [];
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();

	console.log(
		"\nStarting to scrape https://www.takealot.com/all?sort=Relevance%EF%BB%BF%EF%BB%BF\n",
		process.env.PAGE_URL
	);

	const url = process.env.PAGE_URL;

	try {
		await page.goto(
			url ?? "https://www.takealot.com/all?sort=Relevance%EF%BB%BF%EF%BB%BF"
		);

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

		for (let product of products) {
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

			const hasSale = await product.locator("div.card-section ul li").count();

			if (hasSale > 1) {
				productObject.salePrice = parseInt(
					(await product.locator("div.card-section ul li").first().innerText())
						.split(" ")
						.reverse()[0]
				);
			}

			const hasBrand = await product.locator("a > span").count();

			if (hasBrand >= 1) {
				productObject.brand = await product.locator("a > span").innerText();
				productObject.brandLink =
					"https://www.takealot.com" +
					(await product
						.locator("a > span")
						.locator("..")
						.getAttribute("href"));
			}

			const hasRating = await product.locator("div.rating").count();

			if (hasRating >= 1) {
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

		for (let scrapedProduct of scrapedProducts) {
			const url = scrapedProduct.productLink;
			const regex = /PLID(\d+)/;
			const match = url.match(regex);
			let plid = "0";

			if (match) {
				plid = match[1];
				console.log("PLID:", plid);
			}

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

		console.log("Products:", scrapedProducts);
		console.log("Number of products scraped:", scrapedProducts.length);
	} catch (error) {
		console.error("Error while scraping:", error);
	} finally {
		await browser.close();
		console.log("\nWeb scraping ended X_X\n");
	}
})();
