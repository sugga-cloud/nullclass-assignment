
import express from "express";
import { downloadVideo, upgradePlan } from "../controllers/download.js";
const router = express.Router();

router.post("/video", downloadVideo);
router.post("/upgrade", upgradePlan);

export default router;
