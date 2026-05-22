import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sessionMiddleware } from "hono-sessions";
import { mongoStore } from "./model/session/store.js";
import authController from "@/routes/auth.js";
import departureController from "@/routes/departure.js";
import { pollDepartures } from "./polling/polling.js";
import { gracefulShutdown } from "./shutdown.js";
import { connectDb } from "./model/db-util.js";

const app = new Hono();
const isDev = process.env.NODE_ENV === "development";

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

await connectDb();

if (isDev) {
  console.log("🚀 Running in development mode");
}

try {
  if (!process.env.FE_ORIGIN_URL) throw new Error("FE_ORIGIN_URL is not set");
  if (!process.env.AUTH_ENCRYPTION_KEY)
    throw new Error("AUTH_ENCRYPTION_KEY is not set");

  app.use(
    "*",
    cors({
      origin: isDev ? "*" : process.env.FE_ORIGIN_URL!,
    }),
    logger(),
    sessionMiddleware({
      store: mongoStore,
      encryptionKey: process.env.AUTH_ENCRYPTION_KEY,
      expireAfterSeconds: 60 * 60 * 24,
      sessionCookieName: "session",
      cookieOptions: {
        path: "/",
        httpOnly: true,
      },
    }) as any,
  );
} catch (error) {
  console.error("❌ Error setting up middleware:", error);
}

app.onError((err, c) => {
  console.error("❌", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.route("/auth", authController);
app.route("/departures", departureController);

pollDepartures().catch((error) => {
  console.error("❌ Error starting departure polling:", error);
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
