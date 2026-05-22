import { Hono } from "hono";
import { fetchDepaturesForStop } from "../service/ckanDataService.js";
import { getDepartureModel } from "@/model/data/departure.js";

const departureController = new Hono();

departureController.get("", async (c) => {
  try {
    const stopId = c.req.query("stopId");
    if (!stopId) return c.json({ error: "Stop ID is required" }, 400);

    const model = getDepartureModel(stopId);

    if ((await model.countDocuments()) > 0) {
      const cachedData = await model.find().lean();
      return c.json(cachedData, 200);
    } else {
      const ckanResponse = await fetchDepaturesForStop(
        stopId?.toString() || "",
      );

      await model.insertMany(ckanResponse.departures);
      return c.json(ckanResponse.departures, 200);
    }
  } catch (error) {
    console.error(
      `Error registering stop [stopId: ${c.req.query("stopId")}]:`,
      error,
    );
    return c.json({ error: "Failed to register stop" }, 500);
  }
});

export default departureController;
