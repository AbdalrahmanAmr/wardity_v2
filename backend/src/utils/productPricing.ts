export interface ProductSaleFields {
  price: number;
  sale_price: number | null;
  is_on_sale: number | boolean | null;
  sale_ends_at: string | null;
  status: string | null;
  stock_quantity: number | null;
}

export function getEffectiveSale(fields: ProductSaleFields, now = new Date()): {
  salePrice: number | null;
  isOnSale: boolean;
  discountPercent: number;
} {
  const salePrice = fields.sale_price != null ? Number(fields.sale_price) : null;
  const endsAt = fields.sale_ends_at ? new Date(fields.sale_ends_at) : null;
  const isOnSale = Boolean(fields.is_on_sale) &&
    salePrice != null &&
    salePrice > 0 &&
    salePrice < fields.price &&
    (!endsAt || endsAt > now);
  return {
    salePrice: isOnSale ? salePrice : null,
    isOnSale,
    discountPercent: isOnSale ? Math.round(((fields.price - salePrice) / fields.price) * 100) : 0,
  };
}

export function effectiveStatus(fields: Pick<ProductSaleFields, "status" | "stock_quantity">): "In stock" | "Out of stock" {
  return fields.status === "Out of stock" || fields.stock_quantity === 0 ? "Out of stock" : "In stock";
}

export function effectiveProductPrice(fields: ProductSaleFields): number {
  return getEffectiveSale(fields).salePrice ?? fields.price;
}
