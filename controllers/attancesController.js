import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

const attendanceController = {
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
            created_at: new Date()
          }
        });
        return res.status(404).json(responseData);
      }
      const user_id = card.user_id;
      const now = new Date();
      now.setHours(now.getHours() - 6);
      
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0); 

      const studentGroup = await prisma.student_group.findFirst({
        where: { student_id: user_id },
      });
      if (!studentGroup) {
        const responseData = {
          status: "error",
          data: {},
          msg: "El alumno no tiene grupo asignado"
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

      const weekday = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ][now.getDay()];

      const teacherSubjectGroup = await prisma.teacher_subject_group.findMany({
        where: { group_id: studentGroup.group_id },
        include: { schedules: true, subjects: true },
      });
      const currentClass = teacherSubjectGroup.find((tsg) => {
        const schedule = tsg.schedules;
        if (!schedule || schedule.weekday !== weekday) return false;

        const start = new Date(now);
        start.setHours(
          new Date(schedule.start_time).getHours(),
          new Date(schedule.start_time).getMinutes(),
          0,
          0
        );

        const end = new Date(now);
        end.setHours(
          new Date(schedule.end_time).getHours(),
          new Date(schedule.end_time).getMinutes(),
          59,
          999
        );

        return now >= start && now <= end;
      });

      if (!currentClass) {
        const responseData = {
          status: "error",
          data: {},
          msg: "No hay clase para este usuario en este momento",
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
      
      const classStartTime = new Date(now);
      classStartTime.setHours(
        new Date(currentClass.schedules.start_time).getHours(),
        new Date(currentClass.schedules.start_time).getMinutes(),
        0,
        0
      );
      
      const classEndTime = new Date(now);
      classEndTime.setHours(
        new Date(currentClass.schedules.end_time).getHours(),
        new Date(currentClass.schedules.end_time).getMinutes(),
        59,
        999
      );
      
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          user_id,
          subject_id: currentClass.subject_id,
          date: today,
          check_in_time: {
            gte: classStartTime,
            lte: classEndTime,
          },
        },
      });
      
      if (existingAttendance) {
        const responseData = {
          status: "error",
          data: { existing_attendance: existingAttendance },
          msg: "Ya se registró asistencia para esta hora de clase",
        };
        await prisma.sensor_responses.create({
          data: {
            sensor_id,
            response: responseData,
            created_at: new Date()
          }
        });
        return res.status(409).json(responseData);
      }

      const timeDifferenceMs = now.getTime() - classStartTime.getTime();
      const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);

      const status = timeDifferenceMinutes > 15 ? "late" : "present";
      
      const attendance = await prisma.attendance.create({
        data: {
          user_id,
          subject_id: currentClass.subject_id,
          date: today,
          check_in_time: now,
          status: status,
          sensor_id,
        },
      });

    const responseData = {
      status: "success",
      data: { attendance },
      msg: "Asistencia registrada",
    };
    await prisma.sensor_responses.create({
      data: {
        sensor_id: attendance.sensor_id,
        response: responseData,
        created_at: new Date()
      }
    });
    res.json(responseData);
    } catch (error) {
      const responseData = { status: "error", data: {}, msg: error.message };
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

export default attendanceController;
