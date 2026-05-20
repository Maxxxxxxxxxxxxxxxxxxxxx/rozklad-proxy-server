import mongoose from "mongoose";
import { Store } from "hono-sessions";

const SessionSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  data: { type: Object, required: true },
  updatedAt: { type: Date, default: Date.now },
});

const SessionModel =
  mongoose.models.Session || mongoose.model("Session", SessionSchema);

export const mongoStore: Store = {
  getSessionById: async (id: string) => {
    const session = await SessionModel.findById(id);
    return session?.data;
  },

  createSession: async (id: string, value: Record<string, any>) => {
    await SessionModel.findByIdAndUpdate(
      id,
      { data: value, updatedAt: new Date() },
      { upsert: true },
    );
  },

  deleteSession: async (id: string) => {
    await SessionModel.findByIdAndDelete(id);
  },

  persistSessionData: async (id: string, value: Record<string, any>) => {
    await SessionModel.findByIdAndUpdate(
      id,
      { data: value, updatedAt: new Date() },
      { upsert: true },
    );
  },
};
