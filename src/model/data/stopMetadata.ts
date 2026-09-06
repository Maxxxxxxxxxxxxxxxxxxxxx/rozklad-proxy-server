import { StopMetadata } from "@/types.js";
import mongoose from "mongoose";

export const StopMetadataSchema = new mongoose.Schema<StopMetadata>(
  {
    stopId: { type: Number, required: true },
    lastUpdate: { type: String, required: true },
    lastPolled: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const stopMetadataModel = mongoose.model<StopMetadata>(
  "stop_metadata",
  StopMetadataSchema,
);
