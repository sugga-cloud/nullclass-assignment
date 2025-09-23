import express from "express";
import { login, updateprofile, getUserWithDownloads } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.patch("/update/:id", updateprofile);
routes.get("/:id", getUserWithDownloads);
export default routes;
