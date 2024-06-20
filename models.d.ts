export default interface Product {
    name: string;
    imageUrl: string;
    brand?: string;
    brandLink?: string;
    productLink: string;
    rating: number;
    price: number;
    salePrice?: number;
}