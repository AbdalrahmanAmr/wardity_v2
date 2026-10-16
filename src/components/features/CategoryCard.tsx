import { FC } from "react";
import { Link } from "react-router-dom";
import type { Category } from "@/types";
import { categoryIcons } from "@/constants/taxonomyIcons";
import { useLanguage } from "@/contexts/LanguageContext";

interface CategoryCardProps {
  category: Category;
}

// Emoji mapping for category types
export const CategoryCard: FC<CategoryCardProps> = ({ category }) => {
  const { language } = useLanguage();
  const emoji = categoryIcons[category.imageType] || "🌸";

  // Light mode gradient
  const lightGradient = category.bgColor
    ? `linear-gradient(135deg, ${category.bgColor} 0%, #FFD6E0 50%, ${category.bgColor} 100%)`
    : "linear-gradient(135deg, #FFF5F7 0%, #FFD6E0 50%, #FFF5F7 100%)";

  // Dark mode gradient - darker, richer colors with rose tint
  const darkGradient = "linear-gradient(135deg, #2d1f24 0%, #3a2830 50%, #2d1f24 100%)";

  return (
    <Link
      to={`/categories/${category.slug || category.name.toLowerCase().replace(/\s+/g, "-")}`}
      className="group block"
    >
      <div
        className="relative rounded-2xl p-6 flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-900/50 hover:-translate-y-1 overflow-hidden"
        style={{
          background: lightGradient,
        }}
      >
        {/* Dark mode background overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 dark:opacity-100 transition-opacity duration-300"
          style={{
            background: darkGradient,
          }}
        />
        {/* Decorative background circles with better colors */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 dark:bg-primary/25 rounded-full -translate-y-12 translate-x-12 group-hover:scale-125 group-hover:bg-primary/15 dark:group-hover:bg-primary/30 transition-all duration-500 blur-sm z-0" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-rose-300/30 dark:bg-primary/20 rounded-full translate-y-10 -translate-x-10 group-hover:scale-125 transition-all duration-500 blur-sm z-0" />

        {/* Icon */}
        <div className="relative z-10 text-5xl md:text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
          {category.image ? <img src={category.image} alt="" className="h-16 w-16 object-contain" /> : emoji}
        </div>

        {/* Label */}
        <span className="relative z-10 text-sm md:text-base font-semibold text-gray-800 dark:text-white group-hover:text-primary dark:group-hover:text-primary-300 transition-colors text-center">
          <span dir="auto">{language === "ar" ? category.nameAr || category.name_ar || <span lang="en" dir="ltr">{category.name}</span> : category.name}</span>
        </span>
      </div>
    </Link>
  );
};
