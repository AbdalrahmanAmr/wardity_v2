import { Router, Response } from "express";
import { db } from "../database/init.js";

export const occasionsRouter = Router();

/**
 * GET /api/occasions
 * Get all occasions
 */
occasionsRouter.get("/", (_req, res: Response) => {
  const hasNameAr = (db.pragma("table_info('occasions')") as Array<{ name: string }>).some(
    (column) => column.name === "name_ar",
  );
  const occasions = db
    .prepare(
      `SELECT id, slug, name, image_type as imageType${
        hasNameAr ? ", name_ar as nameAr" : ""
      } FROM occasions ORDER BY name`,
    )
    .all() as Array<{
    id: string;
    slug: string;
    name: string;
    imageType: string;
    nameAr?: string | null;
  }>;

  res.json(
    occasions.map((occasion) => ({
      ...occasion,
      ...(hasNameAr ? { nameAr: occasion.nameAr || undefined } : {}),
    })),
  );
});

/**
 * GET /api/occasions/:slug
 * Get occasion by slug
 */
occasionsRouter.get("/:slug", (req, res: Response) => {
  const { slug } = req.params;

  const occasion = db
    .prepare("SELECT id, slug, name, image_type as imageType FROM occasions WHERE slug = ?")
    .get(slug) as
    | {
        id: string;
        slug: string;
        name: string;
        imageType: string;
      }
    | undefined;

  if (!occasion) {
    res.status(404).json({
      message: "Occasion not found",
      status: 404,
    });
    return;
  }

  res.json({
    id: occasion.id,
    slug: occasion.slug,
    name: occasion.name,
    imageType: occasion.imageType,
  });
});
