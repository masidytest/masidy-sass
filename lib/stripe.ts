import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | null = null;

export function stripeClient() {
  const key = env.STRIPE_SECRET_KEY;
  if (!key || key === "placeholder") throw new Error("STRIPE_SECRET_KEY is not configured");
  client ??= new Stripe(key);
  return client;
}

export function stripeWebhookSecret() {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret === "placeholder") throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  return secret;
}
