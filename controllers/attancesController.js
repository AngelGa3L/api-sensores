import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

const attendanceController = {
  checkIn: async (req, res) => {
    try {
      const { user_id, sensor_id } = req.body;
      const now = new Date();
      now.setHours(now.getHours() - 6);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const studentGroup = await prisma.student_group.findFirst({
        where: { student_id: user_id },
      });
      if (!studentGroup) {
        return res
          .status(404)
          .json({ msg: "El alumno no tiene grupo asignado" });
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
        return res.status(404).json({
          status: "error",
          data: {},
          msg: "No hay clase para este alumno en este momento",
        });
      }

      const attendance = await prisma.attendance.create({
        data: {
          user_id,
          subject_id: currentClass.subject_id,
          date: today,
          check_in_time: now,
          status: "present",
          sensor_id,
        },
      });

      res.json({
        status: "success",
        data: { attendance },
        msg: "Asistencia registrada",
      });
    } catch (error) {
      res.status(500).json({ status: "error", data: {}, msg: error.message });
    }
  },
};

export default attendanceController;
