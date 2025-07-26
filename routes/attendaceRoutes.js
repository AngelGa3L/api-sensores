import express from "express";
import { body } from "express-validator";
import attendanceController from "../controllers/attancesController.js";

const router = express.Router();
router.post(
  "/check-in",
  [
    body("uid").notEmpty().withMessage("El UID es requerido"),
    body("sensor_id").isInt(),
  ],
  attendanceController.checkIn
);

export default router;
