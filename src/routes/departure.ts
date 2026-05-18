import { Hono } from "hono";
import { fetchDepaturesForStop } from "../service/ckanDataService";

const app = new Hono();

app.get("/departures", async (c) => {
  try {
    const stopId = c.req.query("stopId");
    const ckanResponse = await fetchDepaturesForStop(stopId?.toString() || "");
    return c.json(ckanResponse);
  } catch (error) {
    return c.json({ error: "Failed to fetch departures" }, 500);
  }
});

export default app;
