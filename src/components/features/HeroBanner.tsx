import { FC, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCarousel } from "@/services/queries/carouselQueries";
import type { CarouselSlide } from "@/services/queries/carouselQueries";

const fallbackSlides: CarouselSlide[] = [
  {
    id: "1",
    headline: "Flowers for Feelings",
    ctaText: "Gift Now",
    ctaLink: "/collections/love-collection",
    image:
      "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=1200&h=600&fit=crop",
  },
  {
    id: "2",
    headline: "Speak from the Heart",
    subHeadline: "With our premium bouquets",
    ctaText: "Shop Now",
    ctaLink: "/collections/new-year",
    image:
      "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=600&fit=crop",
  },
  {
    id: "3",
    headline: "Express Your Love",
    subHeadline: "With our premium bouquets",
    ctaText: "Explore",
    ctaLink: "/categories/bouquets",
    image:
      "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&h=600&fit=crop",
  },
];

export const HeroBanner: FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t, isRTL, language } = useLanguage();
  const carouselQuery = useCarousel();
  const heroSlides =
    carouselQuery.isError || !carouselQuery.data?.length
      ? fallbackSlides
      : carouselQuery.data;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length,
    );
  };

  const slide = heroSlides[currentSlide];

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
        {/* Image */}
        <div className="absolute inset-0">
          <img
            src={slide?.image}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl text-white animate-fade-in">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-snug mb-4 drop-shadow-lg">
              {currentSlide === 0 && !carouselQuery.data ? (
                t("heroTitle")
              ) : (
                <span
                  lang={language === "ar" ? "en" : undefined}
                  dir={language === "ar" ? "ltr" : undefined}
                >
                  {language === "ar" && slide?.headlineAr
                    ? slide.headlineAr
                    : slide?.headline}
                </span>
              )}
            </h1>
            {(language === "ar"
              ? slide?.subHeadlineAr || slide?.subHeadline
              : slide?.subHeadline) && (
              <p className="text-lg md:text-xl text-white/90 mb-6">
                {language === "ar"
                  ? slide?.subHeadlineAr || slide?.subHeadline
                  : slide?.subHeadline}
              </p>
            )}
            <Link
              to={slide?.ctaLink || "/"}
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-semibold hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              {currentSlide === 0 && !carouselQuery.data
                ? t("giftNow")
                : language === "ar"
                  ? slide?.ctaTextAr || slide?.ctaText
                  : slide?.ctaText}
              <ChevronRightIcon
                className={`w-5 h-5 ${isRTL ? "-scale-x-100" : ""}`}
              />
            </Link>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute start-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeftIcon
            className={`w-6 h-6 ${isRTL ? "-scale-x-100" : ""}`}
          />
        </button>
        <button
          onClick={nextSlide}
          className="absolute end-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRightIcon
            className={`w-6 h-6 ${isRTL ? "-scale-x-100" : ""}`}
          />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 start-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="group flex h-11 w-11 items-center justify-center rounded-full transition-all"
              aria-label={`Go to slide ${index + 1}`}
            >
              <span
                aria-hidden="true"
                className={`block h-3 rounded-full transition-all ${
                  index === currentSlide
                    ? "w-8 bg-white"
                    : "w-3 bg-white/50 group-hover:bg-white/70"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
