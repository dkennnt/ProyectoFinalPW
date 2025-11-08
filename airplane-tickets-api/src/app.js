import express from "express";
import cors from "cors";
import { pool } from "./db.js";
import seatRoutes from "./routes/seats.js";
import usersRoutes from "./routes/users.js";
import reservationRoutes from "./routes/reservations.js";
import reportsRoutes from "./routes/reports.js";

const app = express();
app.use(cors({
origin: "http://localhost:4200",  
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json());

// Rutas base
app.use("/seats", seatRoutes);
app.use("/reservations", reservationRoutes);
app.use("/users", usersRoutes);
app.use("/reports", reportsRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("✅ API de Airplane Tickets funcionando correctamente");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  } catch (err) {
    console.error("❌ Error al conectar con la base de datos:", err);
  }
});
