import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

const accessController = {
  checkIn: async (req, res) => {
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

      // 1. Verifica usuario activo
      const user = await prisma.users.findUnique({ where: { id: user_id } });
      if (!user || user.is_active === false) {
        return res
          .status(403)
          .json({ msg: "Usuario desactivado, acceso denegado" });
      }

      // 2. Verifica sensor y salón activos
      const sensor = await prisma.sensors.findUnique({
        where: { id: sensor_id },
        include: { classrooms: true },
      });
      if (!sensor || !sensor.is_active) {
        return res
          .status(403)
          .json({ msg: "Sensor desactivado, acceso denegado" });
      }
      if (!sensor.classrooms || sensor.classrooms.is_blocked) {
        return res
          .status(403)
          .json({ msg: "Salón bloqueado, acceso denegado" });
      }

      // 3. Registra el acceso
      const accessLog = await prisma.access_logs.create({
        data: {
          user_id,
          classroom_id: sensor.classroom_id,
          sensor_id,
          access_time: new Date(),
        },
      });

      res.json({
        status: "success",
        data: { accessLog },
        msg: "Acceso registrado",
      });
    } catch (error) {
      res.status(500).json({ status: "error", msg: error.message });
    }
  },
};

export default accessController;
