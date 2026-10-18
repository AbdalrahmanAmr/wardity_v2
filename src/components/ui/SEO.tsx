import { FC } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO: FC<SEOProps> = ({
  title = "Wardity - A Blooming Connection",
  description = "Experience same-day flower delivery in Cairo only. Shop beautiful bouquets, arrangements, and gifts for every occasion.",
  image = "https://wardity.com/og-image.jpg",
  url = typeof window !== "undefined"
    ? window.location.href
    : "https://wardity.com",
  type = "website",
}) => {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="canonical" href={url} />
    </>
  );
};
