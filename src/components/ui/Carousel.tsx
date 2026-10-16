import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Children } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface CarouselProps {
  children: ReactNode;
  itemClassName?: string;
  ariaLabel: string;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
  gapClassName?: string;
  showDots?: boolean;
  wrapAt?: number;
  wrapClassName?: string;
}

const getDirection = (element: HTMLElement) =>
  getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr";

export function Carousel({
  children,
  itemClassName = "",
  ariaLabel,
  previousLabel,
  nextLabel,
  className = "",
  gapClassName = "gap-4",
  showDots = false,
  wrapAt,
  wrapClassName = "",
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(0);
  const items = Children.toArray(children);
  const shouldWrap = wrapAt !== undefined && items.length <= wrapAt;
  const isArabic = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const resolvedPreviousLabel = previousLabel ?? (isArabic ? "السابق" : "Previous");
  const resolvedNextLabel = nextLabel ?? (isArabic ? "التالي" : "Next");

  const updateState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const rtl = getDirection(track) === "rtl";
    const logicalScroll = rtl ? Math.abs(track.scrollLeft) : track.scrollLeft;
    const overflowing = maxScroll > 1;
    const pages = overflowing
      ? Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth))
      : 1;
    setIsOverflowing(overflowing);
    setAtStart(logicalScroll <= 1);
    setAtEnd(logicalScroll >= maxScroll - 1);
    setPageCount(pages);
    setPage(Math.min(pages - 1, Math.round(logicalScroll / track.clientWidth)));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const resizeObserver = new ResizeObserver(updateState);
    const mutationObserver = new MutationObserver(updateState);
    resizeObserver.observe(track);
    Array.from(track.children).forEach((child) => resizeObserver.observe(child));
    mutationObserver.observe(track, { childList: true, subtree: true });
    track.addEventListener("scroll", updateState, { passive: true });
    updateState();
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      track.removeEventListener("scroll", updateState);
    };
  }, [updateState, children]);

  const scrollPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const rtl = getDirection(track) === "rtl";
    const distance = track.clientWidth * direction * (rtl ? -1 : 1);
    track.scrollBy({
      left: distance,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const rtl = trackRef.current ? getDirection(trackRef.current) === "rtl" : false;
    const forward = event.key === (rtl ? "ArrowLeft" : "ArrowRight");
    scrollPage(forward ? 1 : -1);
  };

  return (
    <div className={`relative ${className}`}>
      {isOverflowing && (
        <>
          <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-8 bg-gradient-to-r from-current/10 to-transparent opacity-60" />
          <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-8 bg-gradient-to-l from-current/10 to-transparent opacity-60" />
          <button
            type="button"
            aria-label={resolvedPreviousLabel}
            disabled={atStart}
            onClick={() => scrollPage(-1)}
            className="absolute start-2 top-1/2 z-20 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 dark:bg-gray-800/90 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeftIcon className="h-5 w-5 rtl:rotate-180" />
          </button>
          <button
            type="button"
            aria-label={resolvedNextLabel}
            disabled={atEnd}
            onClick={() => scrollPage(1)}
            className="absolute end-2 top-1/2 z-20 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 dark:bg-gray-800/90 dark:text-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronRightIcon className="h-5 w-5 rtl:rotate-180" />
          </button>
        </>
      )}
      <div
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className={`${shouldWrap ? `grid overflow-visible ${wrapClassName}` : "flex overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth"} scrollbar-hide outline-none focus-visible:ring-2 focus-visible:ring-primary ${gapClassName}`}
      >
        <div className="contents">
          {items.map((child, index) => (
            <div key={index} className={`shrink-0 snap-start ${itemClassName}`}>
              {child}
            </div>
          ))}
        </div>
      </div>
      {showDots && isOverflowing && pageCount > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: pageCount }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === page ? "w-5 bg-primary" : "w-1.5 bg-primary/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
