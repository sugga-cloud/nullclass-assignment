import mongoose from "mongoose";


const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  premium: { type: Boolean, default: false },
  plan: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free"
  },
  planExpiry: { type: Date },
  lastDownloadDate: { type: String, default: "" },
  downloadCount: { type: Number, default: 0 },
  downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: "videofiles" }],
  downloadsToday: [{
    date: { type: String },
    videoid: { type: mongoose.Schema.Types.ObjectId, ref: "videofiles" }
  }],
});

export default mongoose.model("user", userschema);
