import {
  DEPARTURES_COLLECTION_NAME_REGEX,
  DEFAULT_POLL_INTERVAL_SECONDS,
} from "@/constants.js";
import { getDepartureModel } from "@/model/data/departure.js";
import { stopMetadataModel } from "@/model/data/stopMetadata.js";
import { fetchDepaturesForStop } from "@/service/ckanDataService.js";
import { DeparturesResponse } from "@/types.js";
import mongoose from "mongoose";

async function listDepartureCollections(): Promise<string[]> {
  const collections = await mongoose.connection.db!.listCollections().toArray();
  return collections
    .map((collection) => collection.name)
    .filter((name): name is string =>
      DEPARTURES_COLLECTION_NAME_REGEX.test(name),
    );
}

function getStopIdFromCollection(collectionName: string): string | null {
  const match = DEPARTURES_COLLECTION_NAME_REGEX.exec(collectionName);
  return match?.[1] ?? null;
}

async function pollDepartureCollection(stopId: string) {
  const response: DeparturesResponse = await fetchDepaturesForStop(stopId);

  console.log(
    `Successfully polled departures for ${stopId} at ${new Date().toISOString()}`,
  );

  console.log(
    `Inserted ${response.departures.length} departures in departures_${stopId} at ${new Date().toISOString()}`,
  );
  //   return await response.json();
}

export async function pollDepartures(
  intervalSeconds = DEFAULT_POLL_INTERVAL_SECONDS,
): Promise<NodeJS.Timeout> {
  async function pollOnce() {
    const collections = await listDepartureCollections();
    const stopIds = collections
      .map(getStopIdFromCollection)
      .filter((stopId): stopId is string => stopId !== null);

    if (stopIds.length === 0) {
      return;
    }

    await Promise.allSettled(
      stopIds.map(async (stopId) => {
        try {
          await pollDepartureCollection(stopId);
        } catch (error) {
          console.error(`Polling departures_${stopId} failed:`, error);
        }
      }),
    );
  }

  await pollOnce();
  return setInterval(pollOnce, intervalSeconds * 1000);
}
