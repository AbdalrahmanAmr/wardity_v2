import { FC, FormEvent, useEffect, useState } from "react";
import { useAdminContactSettings, useSaveContactSettings } from "@/services/queries/contactSettingsQueries";
import type { ContactSettings } from "@/types/contactSettings";
import { ErrorBlock, PageLoadingSpinner } from "@/components/ui";
import { useAdminTranslations } from "@/locales/admin";
import { useLanguage } from "@/contexts/LanguageContext";

const methodKeys = ["phone", "email", "whatsapp", "telegram"] as const;
type Method = typeof methodKeys[number];
const hints: Record<Method, "phoneHint" | "emailHint" | "whatsappHint" | "telegramHint"> = {
  phone: "phoneHint", email: "emailHint", whatsapp: "whatsappHint", telegram: "telegramHint",
};

export const AdminSettings: FC = () => {
  const query = useAdminContactSettings();
  const save = useSaveContactSettings();
  const t = useAdminTranslations();
  const { language } = useLanguage();
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (query.data) setSettings(query.data); }, [query.data]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(false);
    if (!settings) return;
    const emptyEnabled = methodKeys.find((method) => settings.enabled[method] && !settings.values[method].trim());
    if (emptyEnabled) {
      const input = event.currentTarget.querySelector<HTMLInputElement>(`#contact-${emptyEnabled}`);
      input?.setCustomValidity(t.contactRequired);
      input?.reportValidity();
      input?.addEventListener("input", () => input.setCustomValidity(""), { once: true });
      return;
    }
    try { await save.mutateAsync(settings); setSuccess(true); }
    catch { setSuccess(false); }
  };

  if (query.isError) return <ErrorBlock message={language === "ar" ? "تعذر تحميل إعدادات التواصل." : "Could not load contact settings."} />;
  if (query.isLoading || !settings) return <PageLoadingSpinner />;

  const labels: Record<Method, string> = { phone: t.contactPhone, email: t.contactEmail, whatsapp: t.contactWhatsapp, telegram: t.contactTelegram };
  return (
    <section className="mx-auto max-w-4xl space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      <header>
        <h1 className="text-3xl font-bold font-serif text-wardity-primary">{t.settings}</h1>
        <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-gray-100">{t.contactSettings}</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{t.contactSettingsIntro}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        {methodKeys.map((method) => (
          <fieldset key={method} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-wardity-card-dark sm:p-6">
            <legend className="px-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{labels[method]}</legend>
            <label htmlFor={`contact-${method}`} className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">{t.contactValue}</label>
            <input
              id={`contact-${method}`}
              type={method === "email" ? "email" : "text"}
              inputMode={method === "phone" || method === "whatsapp" ? "tel" : undefined}
              value={settings.values[method]}
              onChange={(event) => setSettings((current) => current && ({ ...current, values: { ...current.values, [method]: event.target.value } }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              aria-describedby={`hint-${method}`}
            />
            <p id={`hint-${method}`} className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t[hints[method]]}</p>
            <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-gray-800 dark:text-gray-100">
              <input
                type="checkbox"
                checked={settings.enabled[method]}
                onChange={(event) => setSettings((current) => current && ({ ...current, enabled: { ...current.enabled, [method]: event.target.checked } }))}
                className="h-4 w-4 rounded border-gray-400 text-primary focus:ring-primary"
              />
              {t.showPublicly}
            </label>
          </fieldset>
        ))}
        {save.isError && <ErrorBlock message={save.error instanceof Error ? save.error.message : (save.error as { message?: string })?.message || (language === "ar" ? "تعذر حفظ الإعدادات. تحقق من القيم وحاول مرة أخرى." : "Settings could not be saved. Check the values and try again.")} />}
        {success && <p role="status" className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-900 dark:border-green-700 dark:bg-green-950/40 dark:text-green-100">{t.settingsSaved}</p>}
        <button type="submit" disabled={save.isPending} className="min-h-11 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
          {save.isPending ? (language === "ar" ? "جارٍ الحفظ…" : "Saving…") : t.saveSettings}
        </button>
      </form>
    </section>
  );
};
