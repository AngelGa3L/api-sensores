import express from "express";
import { body } from "express-validator";
import imfotmationEspController from "../controllers/imfotmationEsp.js";

const router = express.Router();

router.get("/config", imfotmationEspController.getConfig);

export default router;