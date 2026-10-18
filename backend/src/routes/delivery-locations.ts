import { Router, Response } from "express";
import { dbAll } from "../database/mysql.js";

type DeliveryLocationRecord = {
  id: string;
  name: string;
  nameAr?: string | null;
  deliveryFee?: number | string | null;
  requiresQuote?: boolean | number | null;
};

export const deliveryLocationsRouter = Router();

deliveryLocationsRouter.get("/", async (_req, res: Response) => {
  const locations = await dbAll<DeliveryLocationRecord>(
    "SELECT id, name, name_ar AS nameAr, delivery_fee AS deliveryFee, requires_quote AS requiresQuote FROM delivery_locations WHERE is_active = 1 ORDER BY name",
  );
  res.json({ data: locations.map((location) => ({ ...location, requiresQuote: Boolean(location.requiresQuote) })) });
});
