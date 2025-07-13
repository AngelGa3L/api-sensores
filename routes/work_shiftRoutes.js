import express from "express";
import { body } from "express-validator";
import work_shiftsController from "../controllers/work_shiftsController.js";

const router = express.Router();

router.post(
  "/check-in",
  [body("user_id").isInt(), body("sensor_id").isInt()],
  work_shiftsController.checkIn
);

router.post(
  "/check-out",
  [body("user_id").isInt(), body("sensor_id").isInt()],
  work_shiftsController.checkOut
);

export default router;
