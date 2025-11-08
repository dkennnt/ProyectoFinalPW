import express from "express";
import { pool } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM seat ORDER BY seatid ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener asientos:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
