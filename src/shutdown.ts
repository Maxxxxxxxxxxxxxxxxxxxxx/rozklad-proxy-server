import mongoose from "mongoose";

export async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Initializing graceful teardown...`);

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("📦 Mongoose connection dropped safely.");
    }
  } catch (error) {
    console.error("Error closing database links during termination:", error);
    process.exit(1);
  }

  console.log("👋 Clean exit accomplished.");
  process.exit(0);
}
