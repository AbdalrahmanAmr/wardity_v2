import { FC, useState } from "react";
import { useCategories } from "@/services/queries/categoryQueries";
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/services/queries/adminQueries";
import { PageLoadingSpinner, ErrorBlock, Button, Input, Toast } from "@/components/ui";
import { getErrorMessage } from "@/utils/errorMessage";
import type { Category } from "@/types";

export const AdminCategories: FC = () => {
  const { data: categories, isLoading, isError } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message="Failed to load categories." />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory?.id) {
      try {
        await updateCategory.mutateAsync(editingCategory as Category & { id: string });
        setToast({ type: "success", message: "Category updated successfully." });
      } catch (error) {
        setToast({ type: "error", message: getErrorMessage(error) });
        return;
      }
    } else {
      try {
        await createCategory.mutateAsync(editingCategory as Partial<Category>);
        setToast({ type: "success", message: "Category created successfully." });
      } catch (error) {
        setToast({ type: "error", message: getErrorMessage(error) });
        return;
      }
    }
    setEditingCategory(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory.mutateAsync(id);
        setToast({ type: "success", message: "Category deleted successfully." });
      } catch (error) {
        setToast({ type: "error", message: getErrorMessage(error) });
      }
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-serif text-wardity-primary">Categories</h1>
        <Button onClick={() => setEditingCategory({ name: "", bg_color: "#FFFFFF" })}>Add Category</Button>
      </div>

      <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Name</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Slug</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Image Type</th>
              <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {categories?.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                <td className="p-4 font-medium">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: cat.bgColor || cat.bg_color || "transparent" }}></div>
                    <span>{cat.name}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-500">{cat.slug}</td>
                <td className="p-4">{cat.imageType || cat.image_type || "-"}</td>
                <td className="p-4 space-x-2">
                  <button onClick={() => setEditingCategory(cat)} className="text-blue-500 hover:underline text-sm">Edit</button>
                  <button
                    onClick={() => cat.id && handleDelete(cat.id)}
                    disabled={deleteCategory.isPending}
                    className="text-red-500 hover:underline text-sm disabled:opacity-50"
                  >
                    {deleteCategory.isPending ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {(!categories || categories.length === 0) && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingCategory.id ? "Edit Category" : "New Category"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Name"
                value={editingCategory.name || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                required
              />
              <Input
                label="Image Type (e.g. flower, cake)"
                value={editingCategory.imageType || editingCategory.image_type || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory, imageType: e.target.value, image_type: e.target.value })}
              />
              <Input
                label="Background Color (hex)"
                value={editingCategory.bgColor || editingCategory.bg_color || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory, bgColor: e.target.value, bg_color: e.target.value })}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                <Button type="submit" isLoading={createCategory.isPending || updateCategory.isPending}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
