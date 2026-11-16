import { Router } from "express";
import { dbRun } from "../database/mysql.js";
import { validate, newsletterSubscriptionSchema } from "../utils/validation.js";
import { newsletterRateLimit } from "../middleware/rateLimit.js";

export const newsletterRouter = Router();

newsletterRouter.post("/", newsletterRateLimit, async (req, res) => {
  const { email } = validate(newsletterSubscriptionSchema, req.body);
  const result = await dbRun(
    "INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)",
    [email],
  );
  res
    .status(result.changes > 0 ? 201 : 200)
    .json({ message: "Thank you for subscribing." });
});
