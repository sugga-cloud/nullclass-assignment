import express from "express";
import { streamVideo } from "../controllers/stream.js";


const routes = express.Router();

routes.get("/stream/:videoId", streamVideo);

export default routes;
