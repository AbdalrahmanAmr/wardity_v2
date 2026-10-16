import { FC } from "react";
import { Link } from "react-router-dom";
import { HomeIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/contexts/LanguageContext";

export const NotFound: FC = () => {
  const { language, t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-wardity-bg">
      <div className="text-center px-4">
        <div className="mb-8">
          <span className="text-8xl">🌷</span>
        </div>
        <div className="mb-4">
          <span className="text-7xl font-extrabold text-primary">404</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {language === "ar" ? "الصفحة غير موجودة" : t("notFound")}
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {language === "ar" ? "عذرًا، الصفحة التي تبحث عنها غير متاحة. لنعد إلى متجرنا." : "Oops! The page you're looking for has bloomed elsewhere. Let's get you back to our garden."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-600 transition-all shadow-sm hover:shadow-md"
        >
          <HomeIcon className="w-5 h-5" />
          {language === "ar" ? "العودة للرئيسية" : t("backToShop")}
        </Link>
      </div>
    </div>
  );
};
