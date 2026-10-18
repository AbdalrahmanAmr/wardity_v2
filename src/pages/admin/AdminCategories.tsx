import { FC, useState } from "react";
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/services/queries/adminQueries";
import { PageLoadingSpinner, ErrorBlock, Button, Input, Toast } from "@/components/ui";
import { getErrorMessage } from "@/utils/errorMessage";
import { categoryIcons } from "@/constants/taxonomyIcons";
import type { Category } from "@/types";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useAdminTranslations } from "@/locales/admin";

export const AdminCategories: FC = () => {
  const query = useAdminCategories();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const remove = useDeleteCategory();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const t = useAdminTranslations();
  if (query.isLoading) return <PageLoadingSpinner />;
  if (query.isError) return <ErrorBlock message={t.failedCategories} />;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing?.name?.trim()) { setToast({ type: "error", message: t.requiredCategory }); return; }
    try {
      if (editing.id) await update.mutateAsync({ ...editing, id: editing.id });
      else await create.mutateAsync(editing);
      setEditing(null);
      setToast({ type: "success", message: editing.id ? t.updated : t.created });
    } catch (error) { setToast({ type: "error", message: getErrorMessage(error) }); }
  };
  const slug = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return <div className="space-y-6">
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    <div className="flex items-center justify-between"><h1 className="text-3xl font-bold font-serif text-wardity-primary">{t.categories}</h1><Button onClick={() => setEditing({ name: "", slug: "", imageType: "illustration_bouquet", bgColor: "#FFF5F7", sortOrder: 0, isActive: true })}>{t.addCategory}</Button></div>
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-wardity-card-dark"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b bg-gray-50 dark:bg-gray-800/50"><th className="p-4">Name</th><th className="p-4">Slug</th><th className="p-4">Icon</th><th className="p-4">Products</th><th className="p-4">Active</th><th className="p-4">Order</th><th className="p-4">Actions</th></tr></thead><tbody className="divide-y dark:divide-gray-800">{query.data?.map((category) => <tr key={category.id}><td className="p-4 font-medium">{category.name}</td><td className="p-4 text-gray-500">{category.slug}</td><td className="p-4 text-2xl">{category.image ? <img src={category.image} alt="" className="h-8 w-8 object-contain" /> : categoryIcons[category.imageType] || "🌸"}</td><td className="p-4">{category.productCount ?? 0}{category.productCount === 0 ? "" : ""}</td><td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${category.isActive === false ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}`}>{category.isActive === false ? t.hidden : t.active}</span></td><td className="p-4">{category.sortOrder ?? 0}</td><td className="space-x-3 p-4"><button className="text-blue-600 hover:underline" onClick={() => setEditing(category)}>Edit</button><button className="text-red-600 hover:underline disabled:opacity-50" disabled={remove.isPending} onClick={async () => { if (!category.id || !confirm("Delete this category? Products must be reassigned first.")) return; try { await remove.mutateAsync(category.id); setToast({ type: "success", message: "Category deleted." }); } catch (error) { setToast({ type: "error", message: getErrorMessage(error) }); } }}>Delete</button></td></tr>)}</tbody></table></div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={save} className="max-h-[calc(100dvh-2rem)] w-full max-w-lg space-y-4 overflow-y-auto overscroll-contain rounded-xl bg-white p-6 shadow-xl dark:bg-wardity-card-dark"><h2 className="text-xl font-bold">{editing.id ? t.editCategory : t.newCategory}</h2><Input label={t.nameEn} required value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slug(e.target.value) })} /><Input label={t.nameAr} value={editing.nameAr || ""} onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })} /><Input label={t.slug} required value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /><label className="block text-sm font-medium">{t.icon}<select className="mt-1 w-full rounded-lg border p-2" value={editing.imageType || ""} onChange={(e) => setEditing({ ...editing, imageType: e.target.value })}>{Object.keys(categoryIcons).map((key) => <option key={key} value={key}>{categoryIcons[key]} {key}</option>)}</select></label><ImageUploader images={editing.image ? [editing.image] : []} onChange={(images) => setEditing({ ...editing, image: images[0] })} /><Input label="Background Color" value={editing.bgColor || ""} onChange={(e) => setEditing({ ...editing, bgColor: e.target.value })} /><Input label={t.order} type="number" value={String(editing.sortOrder ?? 0)} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /><label className="flex items-center gap-2"><input type="checkbox" checked={editing.isActive !== false} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> {t.active}</label><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditing(null)}>{t.cancel}</Button><Button type="submit" isLoading={create.isPending || update.isPending}>{t.save}</Button></div></form></div>}
  </div>;
};
