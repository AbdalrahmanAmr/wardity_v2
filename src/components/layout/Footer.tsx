import { FC } from "react";
import { Link } from "react-router-dom";
import { useConsent } from "@/contexts/ConsentContext";
import { useCategories } from "@/services/queries/categoryQueries";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePublicContactSettings } from "@/services/queries/contactSettingsQueries";

const footerLinks = {
  support: [
    { label: "Contact Us", path: "/contact" },
  ],
  company: [
    { label: "About Us", path: "/about" },
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Terms & Conditions", path: "/terms" },
  ],
};
const fallbackShopLinks = [
  { label: "Hand Bouquets", path: "/categories/hand-bouquets" },
  { label: "Boxes", path: "/categories/boxes" },
  { label: "Vases", path: "/categories/vases" },
  { label: "Plants", path: "/categories/plants" },
];

const containsNonAscii = (value: string) =>
  Array.from(value).some((char) => char.charCodeAt(0) > 127);

export const Footer: FC = () => {
  const { openSettings } = useConsent();
  const { t, toggleLanguage, language } = useLanguage();
  const categories = useCategories();
  const contacts = usePublicContactSettings();
  const publicContacts = contacts.data;
  const shopLinks = categories.isError
    ? fallbackShopLinks
    : categories.data?.map((category) => ({
        label:
          language === "ar"
            ? category.nameAr || category.name_ar || category.name
            : category.name,
        path: `/categories/${category.slug}`,
      })) || [];
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🌷</span>
              <div>
                <h2 className="text-xl font-bold text-primary">Wardity</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  <span
                    lang={language === "ar" ? "en" : undefined}
                    dir={language === "ar" ? "ltr" : undefined}
                  >
                    A Blooming Connection
                  </span>
                </p>
              </div>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {language === "ar"
                ? "نوصل الحب والفرح عبر أجمل الزهور والهدايا داخل القاهرة فقط."
                : "Delivering love and joy through beautiful flowers and gifts across Cairo."}
            </p>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t("shop")}
            </h3>
            <ul className="space-y-2">
              {shopLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    <span dir="auto">
                      {language === "ar" &&
                      link.label &&
                      !containsNonAscii(link.label) ? (
                        <span lang="en" dir="ltr">
                          {link.label}
                        </span>
                      ) : (
                        link.label
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t("support")}
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t("company")}
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {publicContacts &&
            (publicContacts.phone ||
              publicContacts.email ||
              publicContacts.whatsapp ||
              publicContacts.telegram) && (
              <div className="col-span-2">
                <h3 className="mb-4 font-semibold text-gray-900 dark:text-gray-100">
                  {t("contact")}
                </h3>
                <ul className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
                  {publicContacts.phone && (
                    <li>
                      <a
                        className="text-gray-700 hover:text-primary dark:text-gray-200"
                        href={`tel:${publicContacts.phone.value.replace(/[^\d+]/g, "")}`}
                        aria-label={t("callPhone", {
                          value: publicContacts.phone.value,
                        })}
                      >
                        <span dir="ltr">{publicContacts.phone.value}</span>
                      </a>
                    </li>
                  )}
                  {publicContacts.email && (
                    <li>
                      <a
                        className="text-gray-700 hover:text-primary dark:text-gray-200"
                        href={`mailto:${publicContacts.email.value}`}
                        aria-label={t("emailUs", {
                          value: publicContacts.email.value,
                        })}
                      >
                        <span dir="ltr">{publicContacts.email.value}</span>
                      </a>
                    </li>
                  )}
                  {publicContacts.whatsapp && (
                    <li>
                      <a
                        className="text-gray-700 hover:text-primary dark:text-gray-200"
                        href={`https://wa.me/${publicContacts.whatsapp.digits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("whatsappUs")}
                      >
                        {t("whatsappUs")}
                      </a>
                    </li>
                  )}
                  {publicContacts.telegram && (
                    <li>
                      <a
                        className="text-gray-700 hover:text-primary dark:text-gray-200"
                        href={publicContacts.telegram.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("telegramUs")}
                      >
                        {t("telegramUs")}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © <bdi>{new Date().getFullYear()}</bdi> Wardity. {t("rights")}
              {" · Built by "}
              <a
                href="https://astra-web-rust.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Astraweb // Web Apps & Websites, Built to Scale"
                className="hover:text-primary"
              >
                Astraweb
              </a>
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleLanguage}
                className="text-sm text-gray-500 hover:text-primary"
              >
                {t("languageSwitch")}
              </button>
              <button
                type="button"
                onClick={openSettings}
                className="text-sm text-gray-500 hover:text-primary"
              >
                {t("cookieSettings")}
              </button>
              <img
                src="https://placehold.co/40x25/f3f4f6/9ca3af?text=Visa"
                alt="INSTAPAY"
                className="h-6"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
