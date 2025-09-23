import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import downloadroutes from "./routes/download.js";
import planroutes from "./routes/plan.js";
import streamroutes from "./routes/stream.js";
dotenv.config();
const app = express();
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { spawn } from "child_process";
app.use(cors({ origin: "*" }../));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Start signaling server automatically
const signalingProcess = spawn("node", [path.join(__dirname, "signaling.js")], {
  stdio: "inherit",
  shell: process.platform === "win32" // for Windows compatibility
});
process.on("exit", () => signalingProcess.kill());
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());

app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/download", downloadroutes);
app.use("/plan", planroutes);
app.use("/video", streamroutes); // add stream endpoints under /video
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((error) => {
    console.log(error);
  });
