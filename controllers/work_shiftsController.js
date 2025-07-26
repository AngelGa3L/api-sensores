import { PrismaClient } from "../generated/prisma/index.js";
import { validationResult } from "express-validator";

const prisma = new PrismaClient();

const work_shiftsController = {
  checkIn: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        data: {},
        msg: "Datos inválidos",
      });
    }

    const { uid, sensor_id } = req.body;

    // Busca el user_id a partir del uid
    const card = await prisma.rfid_cards.findUnique({ where: { uid } });
    if (!card) {
      return res.status(404).json({
        status: "error",
        data: {},
        msg: "Tarjeta no registrada",
      });
    }
    const user_id = card.user_id;
    const now = new Date();
    now.setHours(now.getHours() - 6);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const user = await prisma.users.findUnique({
        where: { id: user_id },
        include: { roles: true },
      });

      if (!user) {
        return res.status(404).json({
          status: "error",
          data: {},
          msg: "Usuario no encontrado",
        });
      }

      if (user.roles.name !== "teacher") {
        return res.status(403).json({
          status: "error",
          data: {},
          msg: "Solo los maestros pueden registrar turnos",
        });
      }

      let shift = await prisma.work_shifts.findFirst({
        where: {
          user_id,
          date: today,
        },
      });

      if (shift) {
        return res.status(400).json({
          status: "error",
          data: {},
          msg: "Ya existe un registro de entrada hoy",
        });
      }

      shift = await prisma.work_shifts.create({
        data: {
          user_id,
          date: today,
          check_in_time: now,
          sensor_id,
        },
      });

      return res.json({
        status: "success",
        data: { shift },
        msg: "Entrada registrada",
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        data: {},
        msg: error.message,
      });
    }
  },

  checkOut: async (req, res) => {
    try {
      const { uid, sensor_id } = req.body;

      // Busca el user_id a partir del uid
      const card = await prisma.rfid_cards.findUnique({ where: { uid } });
      if (!card) {
        return res.status(404).json({
          status: "error",
          data: {},
          msg: "Tarjeta no registrada",
        });
      }
      const user_id = card.user_id;
      const now = new Date();
      now.setHours(now.getHours() - 6);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const shift = await prisma.work_shifts.findFirst({
        where: {
          user_id,
          sensor_id,
          check_out_time: null,
        },
        orderBy: { check_in_time: "desc" },
      });

      if (!shift) {
        return res.status(404).json({
          status: "error",
          data: {},
          msg: "No se encontró un turno abierto para salida",
        });
      }
      const updatedShift = await prisma.work_shifts.update({
        where: { id: shift.id },
        data: { check_out_time: now },
      });

      res.json({
        status: "success",
        data: { shift: updatedShift },
        msg: "Salida registrada",
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        data: {},
        msg: "Error al registrar salida",
        error: error.message,
      });
    }
  },
};

export default work_shiftsController;
