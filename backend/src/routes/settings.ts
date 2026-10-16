import { Router } from "express";
import { publicContactSettings } from "../utils/contactSettings.js";

export const settingsRouter = Router();
settingsRouter.get("/contact", (_req, res) => res.json({ data: publicContactSettings() }));
