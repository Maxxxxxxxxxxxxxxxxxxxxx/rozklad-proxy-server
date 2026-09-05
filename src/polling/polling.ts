import { DEFAULT_POLL_INTERVAL_SECONDS } from "@/constants.js";
import {
  getStopIdFromCollection,
  listDepartureCollections,
  upsertDepartureData,
} from "@/model/db-util.js";
import { fetchDepaturesForStop } from "@/service/ckanDataService.js";
import { DeparturesResponse } from "@/types.js";

async function upsert(stopId: string) {
  const response: DeparturesResponse = await fetchDepaturesForStop(stopId);

  try {
    await upsertDepartureData(response, stopId);

    console.log(`✅ Polled --> ${stopId} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(
      `Error inserting departures for stop ${stopId} at ${new Date().toISOString()}:`,
      error,
    );
  }

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
          await upsert(stopId);
        } catch (error) {
          console.error(`Polling departures_${stopId} failed:`, error);
        }
      }),
    );
  }

  await pollOnce();
  return setInterval(pollOnce, intervalSeconds * 1000);
}
