import { Hono } from "hono";
import { getDepartureModel } from "@/model/data/departure.js";
import { getCachedDepartures } from "@/model/db-util.js";

const departureController = new Hono();

departureController.get("", async (c) => {
  try {
    ``;
    const stopId = c.req.query("stopId");
    if (!stopId) return c.json({ error: "Stop ID is required" }, 400);

    const model = getDepartureModel(stopId);

    if ((await model.countDocuments()) > 0) {
      const cachedData = await model.find().lean();
      return c.json(cachedData, 200);
    } else {
      return c.json(await getCachedDepartures(stopId), 200);
    }
  } catch (error) {
    console.error(
      `Error getting data for stop [stopId: ${c.req.query("stopId")}]:`,
      error,
    );
    return c.json({ error: "Failed to get departure data" }, 500);
  }
});

export default departureController;
