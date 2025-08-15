import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

const accessController = {
  checkIn: async (req, res) => {
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
            created_at: new Date(),
          },
        });
        return res.status(404).json(responseData);
      }
      const user_id = card.user_id;

      // 1. Verifica usuario activo
      const user = await prisma.users.findUnique({ where: { id: user_id } });
      if (!user || user.is_active === false) {
        const responseData = {
          status: "error",
          data: {},
          msg: "Usuario desactivado, acceso denegado",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date(),
          },
        });
        return res.status(403).json(responseData);
      }

      // 2. Verifica sensor y salón activos
      const sensor = await prisma.sensors.findUnique({
        where: { id: sensor_id },
        include: { classrooms: true },
      });
      if (!sensor || !sensor.is_active) {
        const responseData = {
          status: "error",
          data: {},
          msg: "Sensor desactivado, acceso denegado",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date(),
          },
        });
        return res.status(403).json(responseData);
      }
      if (!sensor.classrooms || sensor.classrooms.is_blocked) {
        const responseData = {
          status: "error",
          data: {},
          msg: "Salón bloqueado, acceso denegado",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date(),
          },
        });
        return res.status(403).json(responseData);
      }
      const now = new Date();
      now.setHours(now.getHours() - 6);
      const restricted = await prisma.access_restrictions.findFirst({
        where: { user_id, classroom_id: sensor.classroom_id },
      });

      if (restricted) {
        const responseData = {
          status: "error",
          data: {},
          msg: "Acceso denegado a este usuario",
        };
        await prisma.sensor_responses.create({
          data: { sensor_id, response: responseData, created_at: new Date() },
        });
        return res.status(403).json(responseData);
      }
      // 3. Registra el acceso
      const accessLog = await prisma.access_logs.create({
        data: {
          user_id,
          classroom_id: sensor.classroom_id,
          sensor_id,
          access_time: now,
        },
      });

      const responseData = {
        status: "success",
        data: { accessLog },
        msg: "Acceso registrado",
      };
      await prisma.sensor_responses.create({
        data: {
          sensor_id: accessLog.sensor_id,
          response: responseData,
          created_at: new Date(),
        },
      });
      res.json(responseData);
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
          created_at: new Date(),
        },
      });
      res.status(500).json(responseData);
    }
  },
};

export default accessController;
