import { z } from "zod";

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(1, "Phone number is required").max(50, "Phone number is too long"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const newsletterSubscriptionSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "Email address is too long")
    .email("Invalid email address"),
});

// Product validation schemas
const productFieldsSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  nameAr: z.string().optional().nullable(),
  price: z.number().positive("Price must be positive"),
  image: z.string().url("Image must be a valid URL"),
  badge: z.string().optional().nullable(),
  imageDesc: z.string().optional(),
  brandLogo: z.string().url().optional().nullable(),
  status: z.enum(["In stock", "Out of stock"]).optional(),
  // These fields are nullable in MySQL.  Admin edits can therefore round-trip
  // an existing NULL value; rejecting it here turns a valid edit into a 500.
  sku: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  categoryId: z
    .string()
    .min(1, "Category selection is invalid")
    .optional()
    .nullable(),
  occasionId: z
    .string()
    .min(1, "Occasion selection is invalid")
    .optional()
    .nullable(),
  salePrice: z
    .number()
    .positive("Sale price must be positive")
    .optional()
    .nullable(),
  isOnSale: z.boolean().optional(),
  saleEndsAt: z.string().datetime().optional().nullable(),
  stockQuantity: z
    .number()
    .int()
    .nonnegative("Stock quantity cannot be negative")
    .optional()
    .nullable(),
  images: z.array(z.string().url()).max(8).optional(),
});

export const createProductSchema = productFieldsSchema.superRefine(
  (product, context) => {
    if (product.salePrice != null && product.salePrice >= product.price) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salePrice"],
        message: "Sale price must be less than the regular price",
      });
    }
    if (product.isOnSale && product.salePrice == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salePrice"],
        message: "Sale price is required when a product is on sale",
      });
    }
  },
);

export const updateProductSchema = productFieldsSchema
  .partial()
  .superRefine((product, context) => {
    if (
      product.salePrice != null &&
      product.price != null &&
      product.salePrice >= product.price
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salePrice"],
        message: "Sale price must be less than the regular price",
      });
    }
    if (product.isOnSale && product.salePrice == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salePrice"],
        message: "Sale price is required when a product is on sale",
      });
    }
  });

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  selectedSize: z.string().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

// Wishlist validation schemas
export const addToWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

// Order validation schemas
export const createOrderSchema = z.object({
  shippingAddress: z.string().min(1, "Shipping address is required"),
  customerName: z.string().min(1, "Customer name is required").optional(),
  paymentMethod: z.string().optional(),
  eventId: z.string().uuid().optional(),
  consent: z.boolean().optional().default(false),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  deliveryLocationId: z.string().min(1, "Select a delivery location"),
  requestedDeliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Select a valid delivery date"),
  requestedDeliveryTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
});

export const trackEventSchema = z.object({
  event: z.enum(["AddToCart", "InitiateCheckout"]),
  eventId: z.string().uuid(),
  content_ids: z.array(z.string().min(1)).max(50),
  value: z.number().nonnegative(),
  currency: z.literal("EGP"),
  quantity: z.number().int().positive().optional(),
  consent: z.literal(true),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
