import { chromium } from "playwright";
import ProductInterface from "./models/models";

(async () => {
	const scrapedProducts: ProductInterface[] = [];
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();
	const url = "https://www.takealot.com/all?sort=Relevance%EF%BB%BF%EF%BB%BF";
	try {
		await page.goto(url);
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
			const rating = await product
				.locator("div.rating > div")
				.first()
				.innerText();
			const price = await product
				.locator("div.card-section ul li")
				.last()
				.innerText();

			const productObject: ProductInterface = {
				name,
				imageUrl: imageUrl ?? "",
				productLink,
				rating,
				price,
			};

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

			const hasSale = await product.locator("div.card-section ul li").count();
			if (hasSale > 1) {
				productObject.salePrice = await product
					.locator("div.card-section ul li")
					.first()
					.innerText();
			}

			scrapedProducts.push(productObject);
		}
		console.log("Products:", scrapedProducts);
		console.log("Number of products:", scrapedProducts.length);
	} catch (error) {
		console.error("Error while scraping:", error);
	} finally {
		await browser.close();
	}
})();
