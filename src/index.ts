import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sessionMiddleware, CookieStore, Store } from "hono-sessions";
import { mongoStore } from "./service/store.js";
import mongoose, { mongo } from "mongoose";
import authController from "./routes/auth.js";

const app = new Hono();

const isDev = process.env.NODE_ENV === "development";

const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/rozklad";

  console.log(`Connecting to MongoDB on {${mongoUri}}...`);

  const timeout = setTimeout(() => {
    console.warn(
      "MongoDB connection is taking longer than expected. Please check if the database is running and accessible.",
    );
  }, 8000);

  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected on ${mongoUri}`);
    clearTimeout(timeout);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

await connectDb();

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
  console.error("Error setting up middleware:", error);
}

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.route("/auth", authController);

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
