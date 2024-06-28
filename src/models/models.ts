export interface ProductInterface {
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

interface HitsInterface {
	hits: HitsInfo[];
}

interface HitsInfo {
	_id: string;
	_source: ProductInterface;
}

interface NameInterface {
	input: string[];
}