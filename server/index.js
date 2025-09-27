import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";

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

// middlewares
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(bodyParser.json());

// serve uploads
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// base route
app.get("/", (req, res) => {
  res.send("YouTube backend + signaling working");
});

// routes
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/download", downloadroutes);
app.use("/plan", planroutes);
app.use("/video", streamroutes); // add stream endpoints under /video

// create single http server
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// setup socket.io on same server
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log(`[signaling] New connection: ${socket.id}`);

  socket.on("join", (room) => {
    console.log(`[signaling] ${socket.id} joined room ${room}`);
    socket.join(room);
    socket.to(room).emit("peer-joined");
  });

  socket.on("signal", ({ room, data }) => {
    console.log(`[signaling] Signal from ${socket.id} → room ${room}`);
    socket.to(room).emit("signal", data);
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        console.log(`[signaling] ${socket.id} left room ${room}`);
        socket.to(room).emit("peer-left");
      }
    }
  });
});

// start server
httpServer.listen(PORT, () => {
  console.log(`Server (API + signaling) running on port ${PORT}`);
});

// connect database
const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((error) => {
    console.log(error);
  });
