import { FC, useState } from "react";
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useBulkProductAction,
} from "@/services/queries/adminQueries";
import {
  PageLoadingSpinner,
  ErrorBlock,
  Button,
  Input,
  Toast,
} from "@/components/ui";
import { getErrorMessage } from "@/utils/errorMessage";
import type { Product } from "@/types";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useAdminTranslations } from "@/locales/admin";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useCategories,
  useOccasions,
} from "@/services/queries/categoryQueries";
import {
  BEST_SELLER_BADGE,
  isBestSellerProduct,
  normalizeBestSellerBadge,
} from "@/types/product";

interface ProductDraft extends Partial<Product> {
  images: string[];
}

export const AdminProducts: FC = () => {
  const { data: products, isLoading, isError } = useAdminProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const bulkProductAction = useBulkProductAction();

  const [editingProduct, setEditingProduct] = useState<ProductDraft | null>(
    null,
  );
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [filter, setFilter] = useState<"all" | "sale" | "out" | "low">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkSalePrice, setBulkSalePrice] = useState("");
  const [bulkSalePercent, setBulkSalePercent] = useState("");
  const t = useAdminTranslations();
  const { language } = useLanguage();
  const categoriesQuery = useCategories();
  const occasionsQuery = useOccasions();

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message={t.failedProducts} />;
  const visibleProducts =
    products?.filter(
      (product) =>
        filter === "all" ||
        (filter === "sale" && product.isOnSale) ||
        (filter === "out" && product.status === "Out of stock") ||
        (filter === "low" &&
          product.stockQuantity != null &&
          product.stockQuantity > 0 &&
          product.stockQuantity <= 5),
    ) || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const normalizedProduct = {
        ...editingProduct,
        badge: isBestSellerProduct(editingProduct) ? BEST_SELLER_BADGE : null,
        categoryId: editingProduct.categoryId ?? null,
        occasionId: editingProduct.occasionId ?? null,
        image: editingProduct.images[0] || editingProduct.image || "",
      };

      if (editingProduct?.id) {
        await updateProduct.mutateAsync({
          ...normalizedProduct,
          badge: normalizeBestSellerBadge(normalizedProduct.badge) ?? null,
        } as Product & { id: string });
        setToast({ type: "success", message: "Product updated successfully." });
      } else {
        await createProduct.mutateAsync({
          ...normalizedProduct,
          badge: normalizeBestSellerBadge(normalizedProduct.badge) ?? null,
        });
        setToast({ type: "success", message: "Product created successfully." });
      }
      setEditingProduct(null);
    } catch (error) {
      setToast({ type: "error", message: getErrorMessage(error) });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct.mutateAsync(id);
        setToast({ type: "success", message: "Product deleted successfully." });
      } catch (error) {
        setToast({ type: "error", message: getErrorMessage(error) });
      }
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-serif text-wardity-primary">
          {t.products}
        </h1>
        <Button
          onClick={() =>
            setEditingProduct({ name: "", price: 0, image: "", images: [] })
          }
        >
          {t.addProduct}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "sale", "out", "low"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3 py-1 text-sm ${filter === value ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {value === "all"
              ? "All"
              : value === "sale"
                ? "On sale"
                : value === "out"
                  ? "Out of stock"
                  : "Low stock"}
          </button>
        ))}
        {selected.length > 0 && (
          <>
            <button
              type="button"
              onClick={() =>
                void bulkProductAction.mutateAsync({
                  ids: selected,
                  action: "out_of_stock",
                })
              }
              className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
            >
              Mark out of stock
            </button>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Sale price"
              value={bulkSalePrice}
              onChange={(e) => setBulkSalePrice(e.target.value)}
              className="w-28 rounded-full border px-3 py-1 text-sm"
            />
            <input
              type="number"
              min="1"
              max="99"
              placeholder="% off"
              value={bulkSalePercent}
              onChange={(e) => setBulkSalePercent(e.target.value)}
              className="w-20 rounded-full border px-3 py-1 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const percent = Number(bulkSalePercent);
                const explicitPrice = Number(bulkSalePrice);
                if (explicitPrice > 0)
                  void bulkProductAction.mutateAsync({
                    ids: selected,
                    action: "sale",
                    salePrice: explicitPrice,
                  });
                else if (percent > 0 && percent < 100)
                  void bulkProductAction.mutateAsync({
                    ids: selected,
                    action: "sale",
                    salePercent: percent,
                  });
              }}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              Mark on sale
            </button>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                Image
              </th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                Name
              </th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                Price
              </th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {visibleProducts.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/20"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={(event) =>
                      setSelected((ids) =>
                        event.target.checked
                          ? [...ids, product.id]
                          : ids.filter((id) => id !== product.id),
                      )
                    }
                  />
                </td>
                <td className="p-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                </td>
                <td className="p-4 font-medium">
                  <div className="flex items-center gap-2">
                    <span>{product.name}</span>
                    {isBestSellerProduct(product) && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        {language === "ar" ? "الأكثر مبيعاً" : "Best seller"}
                      </span>
                    )}
                    {!product.nameAr && (
                      <span className="ms-2 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                        {language === "ar" ? "العربية ناقصة" : "Arabic missing"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  {product.isOnSale && (
                    <span className="mr-2 text-xs text-red-600">
                      -{product.discountPercent}%
                    </span>
                  )}
                  ${(product.salePrice ?? product.price).toFixed(2)}{" "}
                  {product.isOnSale && (
                    <del className="text-xs text-gray-400">
                      ${product.price.toFixed(2)}
                    </del>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${product.status === "In stock" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="p-4 space-x-2">
                  <button
                    onClick={() =>
                      setEditingProduct({
                        ...product,
                        categoryId:
                          product.categoryId ?? product.category_id ?? null,
                        occasionId:
                          product.occasionId ?? product.occasion_id ?? null,
                        images:
                          product.images ||
                          (product.image ? [product.image] : []),
                      })
                    }
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleteProduct.isPending}
                    className="text-red-500 hover:underline text-sm disabled:opacity-50"
                  >
                    {deleteProduct.isPending ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct.id ? "Edit Product" : "New Product"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Name"
                value={editingProduct.name || ""}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, name: e.target.value })
                }
                required
              />
              <Input
                label={t.nameAr}
                value={editingProduct.nameAr || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    nameAr: e.target.value,
                  })
                }
              />
              <label className="block text-sm font-medium">
                <span className="mb-1 block">{t.category}</span>
                <select
                  value={editingProduct.categoryId ?? ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      categoryId: e.target.value || null,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600"
                >
                  <option value="">{t.noCategory}</option>
                  {categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {language === "ar" && category.nameAr
                        ? `${category.nameAr} (${category.name})`
                        : category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                <span className="mb-1 block">{t.occasion}</span>
                <select
                  value={editingProduct.occasionId ?? ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      occasionId: e.target.value || null,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-600"
                >
                  <option value="">{t.noOccasion}</option>
                  {occasionsQuery.data?.map((occasion) => (
                    <option key={occasion.id} value={occasion.id}>
                      {language === "ar" && occasion.nameAr
                        ? `${occasion.nameAr} (${occasion.name})`
                        : occasion.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(editingProduct.isOnSale)}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      isOnSale: e.target.checked,
                    })
                  }
                />{" "}
                On sale
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isBestSellerProduct(editingProduct)}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      badge: e.target.checked ? BEST_SELLER_BADGE : null,
                    })
                  }
                />{" "}
                {language === "ar" ? "منتج الأكثر مبيعاً" : "Best seller"}
              </label>
              {editingProduct.isOnSale && (
                <Input
                  label="Sale price"
                  type="number"
                  step="0.01"
                  value={editingProduct.salePrice ?? ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      salePrice: parseFloat(e.target.value),
                    })
                  }
                />
              )}
              {editingProduct.isOnSale &&
                editingProduct.salePrice &&
                editingProduct.price && (
                  <p className="text-sm text-primary">
                    Discount:{" "}
                    {Math.round(
                      ((editingProduct.price - editingProduct.salePrice) /
                        editingProduct.price) *
                        100,
                    )}
                    %
                  </p>
                )}
              {editingProduct.isOnSale && (
                <Input
                  label="Sale ends at (optional)"
                  type="datetime-local"
                  value={
                    editingProduct.saleEndsAt
                      ? editingProduct.saleEndsAt.slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      saleEndsAt: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    })
                  }
                />
              )}
              <Input
                label="Stock quantity (blank means unlimited)"
                type="number"
                min="0"
                value={editingProduct.stockQuantity ?? ""}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? null : parseInt(e.target.value, 10);
                  setEditingProduct({
                    ...editingProduct,
                    stockQuantity: value,
                    status: value === 0 ? "Out of stock" : "In stock",
                  });
                }}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editingProduct.status === "Out of stock"}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      status: e.target.checked ? "Out of stock" : "In stock",
                    })
                  }
                />{" "}
                Out of stock
              </label>
              <Input
                label="Price"
                type="number"
                step="0.01"
                value={editingProduct.price || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    price: parseFloat(e.target.value),
                  })
                }
                required
              />
              <ImageUploader
                images={editingProduct.images}
                onChange={(images) =>
                  setEditingProduct({
                    ...editingProduct,
                    images,
                    image: images[0] || editingProduct.image,
                  })
                }
              />
              <Input
                label="Or paste image URL"
                value={editingProduct.image || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    image: e.target.value,
                    images: e.target.value
                      ? [e.target.value]
                      : editingProduct.images,
                  })
                }
                required={editingProduct.images.length === 0}
              />
              <Input
                label="Description"
                value={editingProduct.description || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    description: e.target.value,
                  })
                }
              />
              <Input
                label={t.descriptionAr}
                value={editingProduct.descriptionAr || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    descriptionAr: e.target.value,
                  })
                }
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={createProduct.isPending || updateProduct.isPending}
                >
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
