export default interface ProductInterface {
	id?: string;
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

export interface ProductResponseInterface {
	hits: HitsInterface;
}

export interface HitsInterface {
	hits: HitsInfo[];
}

export interface HitsInfo {
	_id: string;
	_source: ProductInterface;
}