import { FC } from "react";
import { Link } from "react-router-dom";
import type { Occasion } from "@/types";
import { occasionIcons } from "@/constants/taxonomyIcons";
import { useLanguage } from "@/contexts/LanguageContext";

interface OccasionCardProps {
  occasion: Occasion;
}

// Emoji mapping for occasion types
export const OccasionCard: FC<OccasionCardProps> = ({ occasion }) => {
  const { language } = useLanguage();
  const emoji = occasionIcons[occasion.imageType] || "🎁";

  return (
    <Link
      to={`/occasions/${occasion.slug || occasion.name.toLowerCase().replace(/\s+/g, "-")}`}
      className="group flex flex-col items-center gap-3 p-4"
    >
      {/* Icon Circle */}
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center shadow-sm dark:shadow-gray-900/50 group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
        {occasion.image ? <img src={occasion.image} alt="" className="h-12 w-12 object-contain" /> : <span className="text-3xl md:text-4xl">{emoji}</span>}
      </div>

      {/* Label */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors text-center">
        <span dir="auto">{language === "ar" ? occasion.nameAr || occasion.name_ar || <span lang="en" dir="ltr">{occasion.name}</span> : occasion.name}</span>
      </span>
    </Link>
  );
};
