import { PrismaClient } from "../generated/prisma/index.js";
import { validationResult } from "express-validator";
import { DateTime } from "luxon";

const prisma = new PrismaClient();

const getConfig = async (req, res) => {
  const { esp32_code } = req.query;
  if (!esp32_code) {
    return res.status(400).json({ msg: "Falta el parámetro esp32_code" });
  }

  const sensor = await prisma.sensors.findUnique({
    where: { esp32_code },
  });

  if (!sensor) {
    return res.status(404).json({ msg: "Sensor no encontrado" });
  }

  let action_url = null;
  switch (sensor.type) {
    case "attendance":
      action_url =
        "https://api.smartentry.space/api/sensors/attendance/check-in";
      break;
    case "access":
      action_url = "https://api.smartentry.space/api/sensors/access/check-in";
      break;
    case "work_entry":
      action_url =
        "https://api.smartentry.space/api/sensors/work-shifts/check-in";
      break;
    case "work_out":
      action_url =
        "https://api.smartentry.space/api/sensors/work-shifts/check-out";
      break;
    default:
      action_url = null;
  }

  res.json({
    sensor_type: sensor.type,
    sensor_id: sensor.id,
    action_url,
  });
};

export default {
  getConfig,
};
