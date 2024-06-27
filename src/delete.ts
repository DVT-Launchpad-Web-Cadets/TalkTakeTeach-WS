import { chromium } from "playwright";
import ProductInterface, { ProductResponseInterface } from "./models/models";
import base64 from "base-64";

(async () => {
	let products = await getProducts();

	if (!products) {
		console.error("No products found.");
		return;
	}

	const browser = await chromium.launch();
	const context = await browser.newContext();

	for (let product of products) {
		const url = product.productLink;
		const page = await context.newPage();

		try {
			await page.goto(url);
			const heading = await page.locator("h1").innerText();

			if (
				heading === "Oops!\nIt looks like this product is no longer available."
			) {
				deleteProduct(product.id ?? "");
			}
		} catch (error) {
			console.error(`Error processing ${product.name}:`, error);
		} finally {
			await page.close();
		}
	}

	await browser.close();
})();

async function getProducts() {
	return fetch(
		`${process.env.ELASTIC_URL}/products/_search` ||
			"https://localhost:9200/products/_search",
		{
			method: "post",
			headers: {
				Authorization: `Basic ${base64.encode(
					`elastic:${process.env.ELASTIC_PASSWORD}`
				)}`,
				"Content-Type": "application/json",
			},
			tls: {
				rejectUnauthorized: false,
			},
			body: JSON.stringify({
				size: 1000,
				query: {
					match_all: {},
				},
			}),
		}
	)
		.then((resp) => resp.json())
		.then((res: ProductResponseInterface) =>
			res.hits.hits.map((hit) => {
				hit._source.id = hit._id;
				return hit._source;
			})
		)
		.catch((err) => console.error(err.message));
}

async function deleteProduct(id: string) {
	return fetch(
		`${process.env.ELASTIC_URL}/products/_doc/${id}` ||
			"https://localhost:9200/products/_search",
		{
			method: "delete",
			headers: {
				Authorization: `Basic ${base64.encode(
					`elastic:${process.env.ELASTIC_PASSWORD}`
				)}`,
				"Content-Type": "application/json",
			},
			tls: {
				rejectUnauthorized: false,
			},
		}
	)
		.then((resp) => resp.json())
		.then((res) => console.log(res))
		.catch((err) => console.error(err.message));
}
