import {
  DEFAULT_POLL_INTERVAL_SECONDS,
  DEFAULT_STALE_STOP_CLEANUP_INTERVAL_SECONDS,
  STALE_STOP_THRESHOLD_MS,
} from "@/constants.js";
import {
  deleteStaleStops,
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
    await pollStaleStopCleanup(
      DEFAULT_STALE_STOP_CLEANUP_INTERVAL_SECONDS,
      STALE_STOP_THRESHOLD_MS,
    );
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

export async function pollStaleStopCleanup(
  intervalSeconds = DEFAULT_STALE_STOP_CLEANUP_INTERVAL_SECONDS,
  staleThresholdMs = STALE_STOP_THRESHOLD_MS,
): Promise<NodeJS.Timeout> {
  async function cleanupOnce() {
    try {
      await deleteStaleStops(staleThresholdMs);
    } catch (error) {
      console.error("Error cleaning up stale stops:", error);
    }
  }

  await cleanupOnce();
  return setInterval(cleanupOnce, intervalSeconds * 1000);
}
