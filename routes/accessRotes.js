import express from "express";
import { body } from "express-validator";
import accessController from "../controllers/accessController.js";

const router = express.Router();

router.post(
  "/check-in",
  [
    body("uid").notEmpty().withMessage("El UID es requerido"),
    body("sensor_id").isInt(),
  ],
  accessController.checkIn
);

export default router;
