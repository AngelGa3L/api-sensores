import express from "express";
import { body } from "express-validator";
import accessController from "../controllers/accessController.js";

const router = express.Router();

router.post(
  "/check-in",
  [body("user_id").isInt(), body("sensor_id").isInt()],
  accessController.checkIn
);

export default router;
