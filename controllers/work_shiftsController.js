import { PrismaClient } from "../generated/prisma/index.js";
import { validationResult } from "express-validator";
import { DateTime } from "luxon";

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
      const responseData = {
        status: "error",
        data: {},
        msg: "Tarjeta no registrada",
      };
      await prisma.sensor_responses.create({
        data: {
          sensor_id,
          response: responseData,
          created_at: new Date()
        }
      });
      return res.status(404).json(responseData);
    }
    const user_id = card.user_id;
    const now = DateTime.now().toUTC().minus({ hours: 6 }).toJSDate();
    const today = DateTime.now().toUTC().startOf("day").toJSDate();

    try {
      const user = await prisma.users.findUnique({
        where: { id: user_id },
        include: { roles: true },
      });

      if (!user) {
        const responseData = {
          status: "error",
          data: {},
          msg: "Usuario no encontrado",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date()
          }
        });
        return res.status(404).json(responseData);
      }

      if (user.roles.name === "student") {
        const responseData = {
          status: "error",
          data: {},
          msg: "Los estudiantes no pueden registrar turnos",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date()
          }
        });
        return res.status(403).json(responseData);
      }

      let shift = await prisma.work_shifts.findFirst({
        where: {
          user_id,
          date: today,
        },
      });

      if (shift) {
        const responseData = {
          status: "error",
          data: {},
          msg: "Ya existe un registro de entrada hoy",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date()
          }
        });
        return res.status(400).json(responseData);
      }

      shift = await prisma.work_shifts.create({
        data: {
          user_id,
          date: today,
          check_in_time: now,
          sensor_id,
        },
      });

      const responseData = {
        status: "success",
        data: { shift },
        msg: "Entrada registrada",
      };
      await prisma.sensor_responses.create({
        data: {
          sensor_id: shift.sensor_id,
          response: responseData,
          created_at: new Date()
        }
      });
      return res.json(responseData);
    } catch (error) {
      const responseData = {
        status: "error",
        data: {},
        msg: error.message,
      };
      await prisma.sensor_responses.create({
        data: {
          sensor_id,
          response: responseData,
          created_at: new Date()
        }
      });
      return res.status(500).json(responseData);
    }
  },

  checkOut: async (req, res) => {
    try {
      const { uid, sensor_id } = req.body;

      // Busca el user_id a partir del uid
      const card = await prisma.rfid_cards.findUnique({ where: { uid } });
      if (!card) {
        const responseData = {
          status: "error",
          data: {},
          msg: "Tarjeta no registrada",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date()
          }
        });
        return res.status(404).json(responseData);
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
        const responseData = {
          status: "error",
          data: {},
          msg: "No se encontró un turno abierto para salida",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date()
          }
        });
        return res.status(404).json(responseData);
      }
      const updatedShift = await prisma.work_shifts.update({
        where: { id: shift.id },
        data: { check_out_time: now },
      });

      const responseData = {
        status: "success",
        data: { shift: updatedShift },
        msg: "Salida registrada",
      };
      await prisma.sensor_responses.create({
        data: {
          sensor_id: updatedShift.sensor_id,
          response: responseData,
          created_at: new Date()
        }
      });
      res.json(responseData);
    } catch (error) {
      const responseData = {
        status: "error",
        data: {},
        msg: "Error al registrar salida",
        error: error.message,
      };
      await prisma.sensor_responses.create({
        data: {
          sensor_id,
          response: responseData,
          created_at: new Date()
        }
      });
      res.status(500).json(responseData);
    }
  },
};

export default work_shiftsController;
