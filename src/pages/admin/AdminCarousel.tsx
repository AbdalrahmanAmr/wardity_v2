import { FC, useState } from "react";
import { Button, ErrorBlock, Input, PageLoadingSpinner, Toast } from "@/components/ui";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminTranslations } from "@/locales/admin";
import { getErrorMessage } from "@/utils/errorMessage";
import {
  CarouselSlide,
  useAdminCarousel,
  useCreateCarouselSlide,
  useDeleteCarouselSlide,
  useReorderCarouselSlides,
  useUpdateCarouselSlide,
} from "@/services/queries/carouselQueries";

type SlideDraft = Omit<CarouselSlide, "id" | "sortOrder">;
const emptyDraft: SlideDraft = { image: "", headline: "", headlineAr: "", subHeadline: "", subHeadlineAr: "", ctaText: "", ctaTextAr: "", ctaLink: "/", isVisible: true };

export const AdminCarousel: FC = () => {
  const { data: slides, isLoading, isError } = useAdminCarousel();
  const createSlide = useCreateCarouselSlide();
  const updateSlide = useUpdateCarouselSlide();
  const deleteSlide = useDeleteCarouselSlide();
  const reorderSlides = useReorderCarouselSlides();
  const [draft, setDraft] = useState<SlideDraft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { language } = useLanguage();
  const t = useAdminTranslations();

  if (isLoading) return <PageLoadingSpinner />;
  if (isError) return <ErrorBlock message={t.failedCarousel} />;
  const orderedSlides = slides || [];
  const move = async (index: number, delta: -1 | 1) => {
    const next = [...orderedSlides];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const current = next[index];
    const replacement = next[target];
    if (!current || !replacement) return;
    next[index] = replacement;
    next[target] = current;
    try { await reorderSlides.mutateAsync(next.map((slide) => slide.id)); }
    catch (error) { setToast({ type: "error", message: getErrorMessage(error) }); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    try {
      if (draft.image && draft.headline && draft.ctaText && draft.ctaLink) {
        if (editingId) await updateSlide.mutateAsync({ id: editingId, ...draft });
        else await createSlide.mutateAsync(draft);
        setDraft(null);
        setEditingId(null);
        setToast({ type: "success", message: editingId ? t.updated : t.created });
      }
    } catch (error) { setToast({ type: "error", message: getErrorMessage(error) }); }
  };
  const edit = (slide: CarouselSlide) => {
    setEditingId(slide.id);
    setDraft({
      image: slide.image,
      headline: slide.headline,
      headlineAr: slide.headlineAr || "",
      subHeadline: slide.subHeadline || "",
      subHeadlineAr: slide.subHeadlineAr || "",
      ctaText: slide.ctaText,
      ctaTextAr: slide.ctaTextAr || "",
      ctaLink: slide.ctaLink,
      isVisible: slide.isVisible,
    });
  };
  const remove = async (id: string) => {
    if (!window.confirm(language === "ar" ? "حذف الشريحة؟" : "Delete this slide?")) return;
    try { await deleteSlide.mutateAsync(id); setToast({ type: "success", message: t.deleted }); }
    catch (error) { setToast({ type: "error", message: getErrorMessage(error) }); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold font-serif text-wardity-primary">{t.carousel}</h1>
        <Button onClick={() => { setEditingId(null); setDraft({ ...emptyDraft }); }}>{t.addSlide}</Button>
      </div>
      {orderedSlides.length === 0 && <p className="rounded-xl bg-white p-8 text-center text-gray-500 dark:bg-wardity-card-dark">{t.noSlides}</p>}
      <div className="space-y-3">
        {orderedSlides.map((slide, index) => (
          <div key={slide.id} className="flex flex-col gap-3 rounded-xl border bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-wardity-card-dark sm:flex-row sm:items-center">
            <img src={slide.image} alt={slide.headline} className="h-24 w-full rounded-lg object-cover sm:w-40" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{language === "ar" && slide.headlineAr ? slide.headlineAr : slide.headline}</p>
              <p className="text-sm text-gray-500">{t.order}: {index + 1}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={index === 0 || reorderSlides.isPending} onClick={() => void move(index, -1)} aria-label={t.moveUp}>↑</Button>
              <Button size="sm" variant="outline" disabled={index === orderedSlides.length - 1 || reorderSlides.isPending} onClick={() => void move(index, 1)} aria-label={t.moveDown}>↓</Button>
              <Button size="sm" variant="outline" onClick={() => edit(slide)}>{t.edit}</Button>
              <Button size="sm" variant="danger" onClick={() => void remove(slide.id)}>{t.delete}</Button>
            </div>
          </div>
        ))}
      </div>
      {draft && (
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-wardity-card-dark">
          <h2 className="mb-4 text-xl font-semibold">{editingId ? t.edit : t.addSlide}</h2>
          <form onSubmit={save} className="space-y-4">
            <ImageUploader images={draft.image ? [draft.image] : []} onChange={(images) => setDraft({ ...draft, image: images[0] || "" })} />
            <Input label={t.imageUrl} value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} required />
            <Input label={t.nameEn} value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} required />
            <Input label={t.nameAr} value={draft.headlineAr || ""} onChange={(e) => setDraft({ ...draft, headlineAr: e.target.value })} dir="rtl" />
            <Input label={t.description} value={draft.subHeadline || ""} onChange={(e) => setDraft({ ...draft, subHeadline: e.target.value })} />
            <Input label={t.descriptionAr} value={draft.subHeadlineAr || ""} onChange={(e) => setDraft({ ...draft, subHeadlineAr: e.target.value })} dir="rtl" />
            <Input label={t.ctaText} value={draft.ctaText} onChange={(e) => setDraft({ ...draft, ctaText: e.target.value })} required />
            <Input label={t.ctaTextAr} value={draft.ctaTextAr || ""} onChange={(e) => setDraft({ ...draft, ctaTextAr: e.target.value })} dir="rtl" />
            <Input label={t.link} value={draft.ctaLink} onChange={(e) => setDraft({ ...draft, ctaLink: e.target.value })} required />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isVisible !== false} onChange={(e) => setDraft({ ...draft, isVisible: e.target.checked })} /> {t.active}</label>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setDraft(null); setEditingId(null); }}>{t.cancel}</Button><Button type="submit" isLoading={createSlide.isPending || updateSlide.isPending}>{t.save}</Button></div>
          </form>
        </div>
      )}
    </div>
  );
};
