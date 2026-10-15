import { FC, useState } from "react";
import { useOccasions } from "@/services/queries/categoryQueries";
import { useCreateOccasion, useUpdateOccasion, useDeleteOccasion } from "@/services/queries/adminQueries";
import { PageLoadingSpinner, ErrorBlock, Button, Input, Toast } from "@/components/ui";
import { getErrorMessage } from "@/utils/errorMessage";
import type { Occasion } from "@/types";

export const AdminOccasions: FC = () => {
  const { data: occasions, isLoading, isError } = useOccasions();
  const createOccasion = useCreateOccasion();
  const updateOccasion = useUpdateOccasion();
  const deleteOccasion = useDeleteOccasion();

  const [editingOccasion, setEditingOccasion] = useState<Partial<Occasion> | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message="Failed to load occasions." />;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOccasion?.id) {
      try {
        await updateOccasion.mutateAsync(editingOccasion as Occasion & { id: string });
        setToast({ type: "success", message: "Occasion updated successfully." });
      } catch (error) {
        setToast({ type: "error", message: getErrorMessage(error) });
        return;
      }
    } else {
      try {
        await createOccasion.mutateAsync(editingOccasion as Partial<Occasion>);
        setToast({ type: "success", message: "Occasion created successfully." });
      } catch (error) {
        setToast({ type: "error", message: getErrorMessage(error) });
        return;
      }
    }
    setEditingOccasion(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this occasion?")) {
      try {
        await deleteOccasion.mutateAsync(id);
        setToast({ type: "success", message: "Occasion deleted successfully." });
      } catch (error) {
        setToast({ type: "error", message: getErrorMessage(error) });
      }
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-serif text-wardity-primary">Occasions</h1>
        <Button onClick={() => setEditingOccasion({ name: "" })}>Add Occasion</Button>
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
            {occasions?.map((occ) => (
              <tr key={occ.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                <td className="p-4 font-medium">{occ.name}</td>
                <td className="p-4 text-gray-500">{occ.slug}</td>
                <td className="p-4">{occ.imageType || occ.image_type || "-"}</td>
                <td className="p-4 space-x-2">
                  <button onClick={() => setEditingOccasion(occ)} className="text-blue-500 hover:underline text-sm">Edit</button>
                  <button
                    onClick={() => occ.id && handleDelete(occ.id)}
                    disabled={deleteOccasion.isPending}
                    className="text-red-500 hover:underline text-sm disabled:opacity-50"
                  >
                    {deleteOccasion.isPending ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {(!occasions || occasions.length === 0) && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No occasions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingOccasion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-wardity-card-dark rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingOccasion.id ? "Edit Occasion" : "New Occasion"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="Name"
                value={editingOccasion.name || ""}
                onChange={(e) => setEditingOccasion({ ...editingOccasion, name: e.target.value })}
                required
              />
              <Input
                label="Image Type (e.g. birthday, anniversary)"
                value={editingOccasion.imageType || editingOccasion.image_type || ""}
                onChange={(e) => setEditingOccasion({ ...editingOccasion, imageType: e.target.value, image_type: e.target.value })}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingOccasion(null)}>Cancel</Button>
                <Button type="submit" isLoading={createOccasion.isPending || updateOccasion.isPending}>Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
