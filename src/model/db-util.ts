import mongoose from "mongoose";

import { DeparturesResponse } from "@/types.js";
import { getDepartureModel } from "@/model/data/departure.js";
import { stopMetadataModel } from "@/model/data/stopMetadata.js";
import { fetchDepaturesForStop } from "@/service/ckanDataService.js";
import { DEPARTURES_COLLECTION_NAME_REGEX } from "@/constants.js";

export async function bumpStopPollStatus(stopId: string) {
  const now = new Date();
  await stopMetadataModel.findOneAndUpdate(
    { stopId: Number(stopId) },
    { lastPolled: now },
    { upsert: true },
  );

  console.log(`🕒 BUMP ${stopId}`);
}

export async function getCachedDepartures(
  stopId: string,
): Promise<DeparturesResponse> {
  const metadata = await stopMetadataModel.findOne({ stopId: Number(stopId) });
  const departureModel = getDepartureModel(stopId);
  const cachedDepartures = await departureModel.find().lean();

  if (!metadata && cachedDepartures.length === 0) {
    console.warn(
      `⚠️ No cached data found for stop ${stopId}. Returning empty response.`,
    );
    return {
      lastUpdate: Date.now().toString(),
      departures: [],
    } as DeparturesResponse;
  }

  if (metadata) {
    return {
      lastUpdate: metadata.lastUpdate,
      departures: cachedDepartures,
    } as DeparturesResponse;
  } else throw new Error(`No cached data found for stop ${stopId}`);
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
    console.log(`🔄 No changes detected for stop ${stopId}`);
    return;
  }
  const departureModel = getDepartureModel(stopId);
  const deleteResult = await departureModel.deleteMany({
    trip: { $nin: departureResponse.departures.map((d) => d.trip) },
  });
  const upserted = departureResponse.departures.map((departure) =>
    departureModel.updateOne(
      { trip: departure.trip },
      { $set: departure },
      { upsert: true },
    ),
  );
  await Promise.allSettled(upserted);
  await stopMetadataModel.findOneAndUpdate(
    { stopId: Number(stopId) },
    { lastUpdate: departureResponse.lastUpdate },
    { upsert: true },
  );

  console.log(
    `🗑️ Deleted ${deleteResult.deletedCount} departures for stop ${stopId}`,
  );
  console.log(`🔄 Upserted ${upserted.length} departures for stop ${stopId}`);

  console.log(
    `✅ new departures_${stopId} length: ${await departureModel.countDocuments()} at ${new Date().toISOString()}`,
  );

  // const deleteResult = await departureModel.deleteMany({});
  // console.log(deleteResult.deletedCount, `departures_${stopId} deleted`);

  // // replace all departures for the stop with new data + upsert metadata in parallel
  // await Promise.allSettled([
  //   stopMetadataModel.findOneAndUpdate(
  //     { stopId: Number(stopId) },
  //     { lastUpdate: departureResponse.lastUpdate },
  //     { upsert: true },
  //   ),
  //   departureModel.insertMany(departureResponse.departures),
  // ]);
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

export async function listDepartureCollections(): Promise<string[]> {
  const collections = await mongoose.connection.db!.listCollections().toArray();
  return collections
    .map((collection) => collection.name)
    .filter((name): name is string =>
      DEPARTURES_COLLECTION_NAME_REGEX.test(name),
    );
}

export function getStopIdFromCollection(collectionName: string): string | null {
  const match = DEPARTURES_COLLECTION_NAME_REGEX.exec(collectionName);
  return match?.[1] ?? null;
}

export async function deleteStaleStops(
  staleThresholdMs: number,
): Promise<string[]> {
  const staleBefore = new Date(Date.now() - staleThresholdMs);
  const staleMetadata = await stopMetadataModel.find({
    lastPolled: { $lt: staleBefore },
  });

  const deletedStopIds: string[] = [];

  await Promise.allSettled(
    staleMetadata.map(async (metadata) => {
      const stopId = String(metadata.stopId);
      try {
        const departureModel = getDepartureModel(stopId);
        await departureModel.collection.drop().catch((error: any) => {
          if (error?.codeName !== "NamespaceNotFound") throw error;
        });
        await stopMetadataModel.deleteOne({ stopId: metadata.stopId });
        deletedStopIds.push(stopId);

        console.log(
          `🧹 Removed stale stop ${stopId} (last polled ${Math.floor((Date.now() - metadata.lastPolled.getTime()) / 1000)} seconds ago)`,
        );
      } catch (error) {
        console.error(`Error cleaning up stale stop ${stopId}:`, error);
      }
    }),
  );

  return deletedStopIds;
}
