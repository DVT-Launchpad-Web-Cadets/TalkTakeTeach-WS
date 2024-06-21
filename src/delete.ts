import { chromium } from "playwright";
import ProductInterface from "./models/models";

(async () => {
	const products: ProductInterface[] = [
		{
			name: "Sea Moss Gel",
			imageUrl:
				"https://media.takealot.com/covers_images/44a6e898a7da4d6f85e7a12ad497376a/s-fb.file",
			productLink: "https://www.takealot.com/sea-moss-gel/PLID93333807",
			price: 350,
			salePrice: 230,
			brand: "Neogenesis Health",
			brandLink:
				"https://www.takealot.com/all?filter=Brand:Neogenesis%20Health",
			rating: 4.5,
			numberOfReviews: 334,
		},
		{
			name: "1.2L Tumbler with Handle Straw Lid, Stainless Steel Travel Mug",
			imageUrl:
				"https://media.takealot.com/covers_images/34d7c1f173fb4a438c390967ee05f9f1/s-fb.file",
			productLink:
				"https://www.takealot.com/1-2l-tumbler-with-handle-straw-lid-stainless-steel-travel-mug/PLID94711939",
			price: 193,
			rating: 4.5,
			numberOfReviews: 184,
		},
		{
			name: "20W PD Fast Charger For iPhone with USB-C to Lightning Cable",
			imageUrl:
				"https://media.takealot.com/covers_images/cd8ac9f62bbc402da70b9b27e2b64e12/s-fb.file",
			productLink:
				"https://www.takealot.com/20w-pd-fast-charger-for-iphone-with-usb-c-to-lightning-cable/PLID71977353",
			price: 200,
			salePrice: 114,
			rating: 3.8,
			numberOfReviews: 1895,
		},
		{
			name: "TROO Certified Fast Charge 60W USB Type-C Braided Cable (Android Auto-Ready)",
			imageUrl:
				"https://media.takealot.com/covers_images/95ad1f7ddda242469a63ef70487309ba/s-fb.file",
			productLink:
				"https://www.takealot.com/troo-certified-fast-charge-60w-usb-type-c-braided-cable-android-auto-ready/PLID90255552",
			price: 99,
			brand: "TROO",
			brandLink: "https://www.takealot.com/all?filter=Brand:TROO",
			rating: 4.7,
			numberOfReviews: 791,
		},
		{
			name: "Blue Box A4 Laminating Pouches 150 Micron - 100 Pouches",
			imageUrl:
				"https://media.takealot.com/covers_images/25704a1c550648b5ba2653471c18469a/s-fb.file",
			productLink:
				"https://www.takealot.com/blue-box-a4-laminating-pouches-150-micron-100-pouches/PLID70778652",
			price: 149,
			salePrice: 109,
			brand: "Blue Box",
			brandLink: "https://www.takealot.com/all?filter=Brand:Blue%20Box",
			rating: 4.8,
			numberOfReviews: 714,
		},
		{
			name: "M10 Wireless Earphone with Power Bank Charging Case",
			imageUrl:
				"https://media.takealot.com/covers_images/9ad701169bda4e5b95a8aef5e73b643f/s-fb.file",
			productLink:
				"https://www.takealot.com/m10-wireless-earphone-with-power-bank-charging-case/PLID91107489",
			price: 189,
			salePrice: 119,
			rating: 4,
			numberOfReviews: 735,
		},
		{
			name: "6L Digital Roaster Air Fryer with Paper Liners",
			imageUrl:
				"https://media.takealot.com/covers_images/055772c8fe06464e8258d4af33a67132/s-fb.file",
			productLink:
				"https://www.takealot.com/6l-digital-roaster-air-fryer-with-paper-liners/PLID93227833",
			price: 1,
			salePrice: 589,
			rating: 4.4,
			numberOfReviews: 858,
		},
		{
			name: "TRESemme Care and Protect Heat Protection Spray Hair Treatment 300ml",
			imageUrl:
				"https://media.takealot.com/covers_images/86230a6ae18d4a66b6030be2bf36d417/s-fb.file",
			productLink:
				"https://www.takealot.com/tresemme-care-and-protect-heat-protection-spray-hair-treatment-300ml/PLID41295269",
			price: 119,
			salePrice: 97,
			brand: "Tresemme",
			brandLink: "https://www.takealot.com/all?filter=Brand:Tresemme",
			rating: 4.7,
			numberOfReviews: 1111,
		},
		{
			name: "TWS Wireless Earphones i12",
			imageUrl:
				"https://media.takealot.com/covers_images/9cf3bc2a1fca400893a9e514072bcfbe/s-fb.file",
			productLink:
				"https://www.takealot.com/tws-wireless-earphones-i12/PLID90233146",
			price: 118,
			rating: 3.8,
			numberOfReviews: 1882,
		},
		{
			name: "10 in 1 Baby Care Kit",
			imageUrl:
				"https://media.takealot.com/covers_tsins/55532033/55532033-1-fb.jpg",
			productLink:
				"https://www.takealot.com/10-in-1-baby-care-kit/PLID525845759",
			price: 91,
			rating: 4.7,
			numberOfReviews: 1681,
		},
		{
			name: "Mondi Rotatrim A4 Office Copy Paper Ream White 500 Sheets",
			imageUrl:
				"https://media.takealot.com/covers_tsins/40876850/6003977000190-1-fb.jpg",
			productLink:
				"https://www.takealot.com/mondi-rotatrim-a4-office-copy-paper-ream-white-500-sheets/PLID38148850",
			price: 190,
			salePrice: 120,
			brand: "Mondi",
			brandLink: "https://www.takealot.com/all?filter=Brand:Mondi",
			rating: 4.7,
			numberOfReviews: 379,
		},
		{
			name: "Super Fast 45W Charging Wall Charger & Type C to Type C Cable - Black",
			imageUrl:
				"https://media.takealot.com/covers_images/7195d7c502c34c69ae90487eb99630da/s-fb.file",
			productLink:
				"https://www.takealot.com/super-fast-45w-charging-wall-charger-type-c-to-type-c-cable-black/PLID90807249",
			price: 200,
			salePrice: 134,
			brand: "H-Tech",
			brandLink: "https://www.takealot.com/all?filter=Brand:H-Tech",
			rating: 3.4,
			numberOfReviews: 838,
		},
		{
			name: "World Map Anti-Slip Extended Mouse Pad",
			imageUrl:
				"https://media.takealot.com/covers_images/62547a7d91ac4c02a86a6e31dd10adbc/s-fb.file",
			productLink:
				"https://www.takealot.com/world-map-anti-slip-extended-mouse-pad/PLID707227390",
			price: 99,
			rating: 4.5,
			numberOfReviews: 1536,
		},
	];

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
				console.log(`${product.name} does not exist. Delete`);
			}
		} catch (error) {
			console.error(`Error processing ${product.name}:`, error);
		} finally {
			await page.close();
		}
	}

	await browser.close();
})();
