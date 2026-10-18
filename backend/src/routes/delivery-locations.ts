import { Router, Response } from "express";
import { dbAll } from "../database/mysql.js";

export const deliveryLocationsRouter = Router();

deliveryLocationsRouter.get("/", async (_req, res: Response) => {
  const locations = await dbAll(
    "SELECT id, name, name_ar AS nameAr, delivery_fee AS deliveryFee, requires_quote AS requiresQuote FROM delivery_locations WHERE is_active = 1 ORDER BY name",
  );
  res.json({ data: locations.map((location: any) => ({ ...location, requiresQuote: Boolean(location.requiresQuote) })) });
});
