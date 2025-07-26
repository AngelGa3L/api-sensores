import express from "express";
import { body } from "express-validator";
import work_shiftsController from "../controllers/work_shiftsController.js";

const router = express.Router();

router.post(
  "/check-in",
  [
    body("uid").notEmpty().withMessage("El UID es requerido"),
    body("sensor_id")
      .isInt()
      .withMessage("El sensor_id debe ser un número entero"),
  ],
  work_shiftsController.checkIn
);

router.post(
  "/check-out",
  [
    body("uid").notEmpty().withMessage("El UID es requerido"),
    body("sensor_id")
      .isInt()
      .withMessage("El sensor_id debe ser un número entero"),
  ],
  work_shiftsController.checkOut
);

export default router;
