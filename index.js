import { chromium } from "playwright";
(async () => {
	const scrappedProducts = [];
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
			let productObject = {};
			productObject.name = await product.locator("h4").innerText();
			productObject.imageUrl = await product
				.locator("div.image-box img")
				.getAttribute("src");
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
			productObject.productLink =
				"https://www.takealot.com" +
				(await product.locator("> a").getAttribute("href"));
			productObject.rating = await product
				.locator("div.rating > div")
				.first()
				.innerText();
			const hasSale = await product.locator("div.card-section ul li").count();
			if (hasSale > 1) {
				productObject.price = await product
					.locator("div.card-section ul li")
					.last()
					.innerText();
				productObject.salePrice = await product
					.locator("div.card-section ul li")
					.first()
					.innerText();
			} else {
				productObject.price = await product.locator("li.price").innerText();
			}

			scrappedProducts.push(productObject);
		}
		console.log("Products:", scrappedProducts);
		console.log("Number of products:", scrappedProducts.length);
	} catch (error) {
		console.error("Error while scraping:", error);
	} finally {
		await browser.close();
	}
})();
