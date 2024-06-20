import { chromium } from "playwright";
(async () => {
	let scrappedProducts = [];
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();
	const url = "https://www.takealot.com/all?sort=Relevance%EF%BB%BF%EF%BB%BF";
	try {
		await page.goto(url);
		const products = await page.$$("div.listings-container-module_listings-container_AC4LI > div > div");
		if (!products) {
			throw new Error("No products found");
		}
		console.log("number of products scrapped:", products.length);
		for (let product of products) {
			let productObject = {};
			productObject.productLink = await product.$eval("div > div > a", (el) => el.getAttribute("href"));
			// productObject.name = await product.$eval("div > div > div > div > a > h3", (el) => el.textContent);
			console.log("productObject: ", productObject);
		}
		
	} catch (error) {
		console.error("Error while scraping:", error);
	} finally {
		await browser.close();
	}
})();
