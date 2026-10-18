import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { DeliveryLocation } from "@/services/queries/deliveryLocationQueries";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { useLanguage } from "@/contexts/LanguageContext";

type Draft = { id?: string; name: string; nameAr: string; deliveryFee: string; requiresQuote: boolean; isActive: boolean };
const empty = (): Draft => ({ name: "", nameAr: "", deliveryFee: "", requiresQuote: false, isActive: true });

export function AdminDeliveryLocations() {
  const { language } = useLanguage(); const client = useQueryClient(); const [draft, setDraft] = useState<Draft | null>(null); const [message, setMessage] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["admin", "delivery-locations"], queryFn: async () => (await api.get<{ data: DeliveryLocation[] }>("/admin/delivery-locations")).data });
  const save = useMutation({ mutationFn: async (data: Draft) => {
    const body = { ...data, deliveryFee: data.requiresQuote || data.deliveryFee === "" ? null : Number(data.deliveryFee) };
    return data.id ? api.patch(`/admin/delivery-locations/${data.id}`, body) : api.post("/admin/delivery-locations", body);
  }, onSuccess: () => { void client.invalidateQueries({ queryKey: ["admin", "delivery-locations"] }); void client.invalidateQueries({ queryKey: ["delivery-locations"] }); setDraft(null); setMessage(language === "ar" ? "تم الحفظ" : "Saved"); } });
  const submit = (event: FormEvent) => { event.preventDefault(); if (draft) save.mutate(draft); };
  if (query.isLoading) return <LoadingSpinner />;
  if (query.isError) return <ErrorBlock message={language === "ar" ? "تعذر تحميل مناطق التوصيل" : "Could not load delivery locations"} />;
  return <div className="mx-auto max-w-5xl" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="mb-6 flex items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{language === "ar" ? "مناطق التوصيل" : "Delivery locations"}</h1><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{language === "ar" ? "يجب تحديد سعر كل منطقة قبل استخدامها في الطلبات المدفوعة." : "Configure a fee before a location can be used for paid delivery."}</p></div><button className="rounded-lg bg-primary px-4 py-2 font-semibold text-white" onClick={() => setDraft(empty())}>{language === "ar" ? "إضافة منطقة" : "Add location"}</button></div>
    {message && <p className="mb-4 text-sm text-green-700">{message}</p>}
    {draft && <form onSubmit={submit} className="mb-6 grid gap-3 rounded-xl bg-white p-5 shadow-sm dark:bg-gray-800 md:grid-cols-2"><input required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name (English)" className="rounded border p-2"/><input required value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} placeholder="الاسم بالعربية" className="rounded border p-2"/><input disabled={draft.requiresQuote} type="number" min="0" step="0.01" value={draft.deliveryFee} onChange={(e) => setDraft({ ...draft, deliveryFee: e.target.value })} placeholder={language === "ar" ? "رسوم التوصيل" : "Delivery fee"} className="rounded border p-2"/><label className="flex items-center gap-2"><input type="checkbox" checked={draft.requiresQuote} onChange={(e) => setDraft({ ...draft, requiresQuote: e.target.checked })}/>{language === "ar" ? "يتطلب عرض سعر" : "Requires quote"}</label><label className="flex items-center gap-2"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}/>{language === "ar" ? "نشط" : "Active"}</label><div className="flex gap-2"><button disabled={save.isPending} className="rounded bg-primary px-4 py-2 text-white">{language === "ar" ? "حفظ" : "Save"}</button><button type="button" onClick={() => setDraft(null)} className="rounded border px-4 py-2">{language === "ar" ? "إلغاء" : "Cancel"}</button></div>{save.isError && <p className="text-sm text-red-600">{save.error instanceof Error ? save.error.message : "Save failed"}</p>}</form>}
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm dark:bg-gray-800"><table className="w-full text-sm"><thead><tr className="border-b text-start"><th className="p-3">{language === "ar" ? "الاسم" : "Name"}</th><th className="p-3">{language === "ar" ? "الرسوم" : "Fee"}</th><th className="p-3">{language === "ar" ? "الحالة" : "Status"}</th><th className="p-3"/></tr></thead><tbody>{query.data?.map((item) => <tr key={item.id} className="border-b"><td className="p-3">{language === "ar" ? item.nameAr : item.name}</td><td className="p-3">{item.requiresQuote ? (language === "ar" ? "عرض سعر" : "Quote required") : item.deliveryFee == null ? (language === "ar" ? "غير مهيأ" : "Not configured") : `${item.deliveryFee} EGP`}</td><td className="p-3">{item.isActive ? (language === "ar" ? "نشط" : "Active") : (language === "ar" ? "غير نشط" : "Inactive")}</td><td className="p-3"><button onClick={() => setDraft({ id: item.id, name: item.name, nameAr: item.nameAr, deliveryFee: item.deliveryFee == null ? "" : String(item.deliveryFee), requiresQuote: item.requiresQuote, isActive: item.isActive !== false })} className="text-primary underline">{language === "ar" ? "تعديل" : "Edit"}</button></td></tr>)}</tbody></table></div>
  </div>;
}
