import express from "express";
import cors from "cors";
import work_shiftRoutes from "./routes/work_shiftRoutes.js";
import attendanceController from "./routes/attendaceRoutes.js";
import accessController from "./routes/accessRotes.js";
import informationEspRouter from "./routes/informationEsp.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/api/sensors/work-shifts/", work_shiftRoutes);
app.use("/api/sensors/attendance/", attendanceController);
app.use("/api/sensors/access/", accessController);
app.use("/api/sensors/", informationEspRouter);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
