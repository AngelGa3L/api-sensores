import express from "express";
import cors from "cors";
import work_shiftRoutes from "./routes/work_shiftRoutes.js";

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
app.use("/api/sensors/work-shifts/", work_shiftRoutes)

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
