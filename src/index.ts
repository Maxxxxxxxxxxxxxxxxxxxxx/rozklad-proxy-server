import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sessionMiddleware, CookieStore } from "hono-sessions";

const app = new Hono();

const sessionStore = new CookieStore();
const isDev = process.env.NODE_ENV === "development";

if (isDev) {
  console.log("Running in development mode");
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
      store: sessionStore,
      encryptionKey: process.env.AUTH_ENCRYPTION_KEY,
      expireAfterSeconds: 60 * 60 * 24,
      sessionCookieName: "session",
      cookieOptions: {
        path: "/",
        httpOnly: true,
      },
    }),
  );
} catch (error) {
  console.error("Error setting up middleware:", error);
}

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
