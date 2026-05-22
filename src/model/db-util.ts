import mongoose from "mongoose";

import { DeparturesResponse, StopMetadata } from "@/types.js";
import { getDepartureModel } from "@/model/data/departure.js";
import { stopMetadataModel } from "@/model/data/stopMetadata.js";

export async function getCachedDepartures(stopId: string) {
  const metadata = await stopMetadataModel.findOne({ stopId: Number(stopId) });
  const departureModel = getDepartureModel(stopId);

  const cachedDepartures = await departureModel.find().lean();

  if (metadata) {
    return {
      lastUpdate: metadata.lastUpdate,
      departures: cachedDepartures,
    } as DeparturesResponse;
  }

  throw new Error(`No cached data found for stop ${stopId}`);
}

export async function upsertDepartureData(
  departureResponse: DeparturesResponse,
  stopId: string,
) {
  const existingMetadata = await stopMetadataModel.findOne({
    stopId: Number(stopId),
  });

  // if we have existing metadata and the lastUpdate matches the new data, skip the update
  if (
    existingMetadata &&
    existingMetadata.lastUpdate === departureResponse.lastUpdate
  ) {
    return;
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const departureModel = getDepartureModel(stopId);

    // upsert metadata with new lastUpdate
    await stopMetadataModel.findOneAndUpdate(
      { stopId: Number(stopId) },
      { lastUpdate: departureResponse.lastUpdate },
      { upsert: true, session },
    );

    // replace all departures for the stop with new data
    await departureModel.deleteMany({}, { session });
    await departureModel.insertMany(departureResponse.departures, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();

    console.error(
      `Error updating departures for stop ${stopId} at ${new Date().toISOString()}:`,
      error,
    );
  } finally {
    session.endSession();
  }
}

export async function connectDb() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/rozklad";

  console.log(`Connecting to MongoDB on {${mongoUri}}... 🚀`);

  const timeout = setTimeout(() => {
    console.warn(
      "⏳ MongoDB connection is taking longer than expected. Please check if the database is running and accessible.",
    );
  }, 8000);

  try {
    await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB connected on ${mongoUri}`);
    clearTimeout(timeout);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }
}
