import { Router, Request, Response } from "express";
import { validate, trackEventSchema } from "../utils/validation.js";
import { sendMetaEvent } from "../services/metaCapi.js";

export const trackingRouter = Router();
const requests = new Map<string, { count: number; resetAt: number }>();
function cookie(req: Request, name: string): string | undefined {
  return req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

trackingRouter.post("/", (req: Request, res: Response) => {
  const ip = req.ip || "unknown";
  const now = Date.now();
  const current = requests.get(ip);
  if (!current || current.resetAt < now) requests.set(ip, { count: 1, resetAt: now + 60_000 });
  else if (current.count >= 60) { res.status(429).json({ message: "Too many tracking requests." }); return; }
  else current.count += 1;
  let event;
  try {
    event = validate(trackEventSchema, req.body);
  } catch {
    res.status(400).json({ message: "Invalid tracking event." });
    return;
  }
  res.status(202).json({ accepted: true });
  setImmediate(() => sendMetaEvent({
    eventName: event.event,
    eventId: event.eventId,
    value: event.value,
    contents: event.content_ids.map((id) => ({ id, quantity: event.quantity || 1, item_price: event.value })),
    eventSourceUrl: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
    clientIp: req.ip,
    userAgent: req.get("user-agent"),
    fbp: cookie(req, "_fbp"),
    fbc: cookie(req, "_fbc"),
  }));
});
