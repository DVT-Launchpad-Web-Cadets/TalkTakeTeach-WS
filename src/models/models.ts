export default interface ProductInterface {
	name: string;
	imageUrl: string;
	brand?: string;
	brandLink?: string;
	productLink: string;
	rating?: number;
	numberOfReviews?: number;
	price: number;
	salePrice?: number;
}
