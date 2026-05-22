import mongoose from "mongoose";
import { DepartureData } from "@/types.js";

export const DepartureSchema = new mongoose.Schema<DepartureData>(
  {
    id: { type: String, required: true, unique: true },
    delayInSeconds: { type: Number },
    estimatedTime: { type: String },
    headsign: { type: String },
    routeId: { type: Number },
    routeShortName: { type: String },
    scheduledTripStartTime: { type: String },
    tripId: { type: Number },
    status: { type: String },
    theoreticalTime: { type: String },
    timestamp: { type: String },
    trip: { type: Number },
    vehicleCode: { type: Number },
    vehicleId: { type: Number },
    vehicleService: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export function getDepartureModel(stopId: string) {
  const modelName = `departures_${stopId}`;

  if (mongoose.models[modelName]) {
    return mongoose.models[modelName] as mongoose.Model<DepartureData>;
  }

  return mongoose.model<DepartureData>(modelName, DepartureSchema);
}
