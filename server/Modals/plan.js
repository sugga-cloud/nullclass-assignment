import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], required: true },
  price: { type: Number, required: true },
  maxWatchMinutes: { type: Number }, // null or undefined means unlimited
});

export default mongoose.model("Plan", planSchema);