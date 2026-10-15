import { Router, Response } from "express";
import { db } from "../database/init.js";

export const categoriesRouter = Router();

/**
 * GET /api/categories
 * Get all categories
 */
categoriesRouter.get("/", (_req, res: Response) => {
  const hasNameAr = (db.pragma("table_info('categories')") as Array<{ name: string }>).some(
    (column) => column.name === "name_ar",
  );
  const categories = db
    .prepare(
      `SELECT id, slug, name, image_type as imageType, bg_color as bgColor${
        hasNameAr ? ", name_ar as nameAr" : ""
      } FROM categories ORDER BY name`,
    )
    .all() as Array<{
    id: string;
    slug: string;
    name: string;
    imageType: string;
    bgColor: string | null;
    nameAr?: string | null;
  }>;

  const formattedCategories = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    imageType: c.imageType,
    bgColor: c.bgColor || undefined,
    ...(hasNameAr ? { nameAr: c.nameAr || undefined } : {}),
  }));

  res.json(formattedCategories);
});

/**
 * GET /api/categories/:slug
 * Get category by slug
 */
categoriesRouter.get("/:slug", (req, res: Response) => {
  const { slug } = req.params;

  const category = db
    .prepare("SELECT id, slug, name, image_type as imageType, bg_color as bgColor FROM categories WHERE slug = ?")
    .get(slug) as
    | {
        id: string;
        slug: string;
        name: string;
        imageType: string;
        bgColor: string | null;
      }
    | undefined;

  if (!category) {
    res.status(404).json({
      message: "Category not found",
      status: 404,
    });
    return;
  }

  res.json({
    id: category.id,
    slug: category.slug,
    name: category.name,
    imageType: category.imageType,
    bgColor: category.bgColor || undefined,
  });
});
