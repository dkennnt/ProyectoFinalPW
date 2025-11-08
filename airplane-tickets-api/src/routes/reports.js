import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ===== RESUMEN DE REPORTES =====
router.get("/summary", async (req, res) => {
  try {
    const queries = {
      total_users: `SELECT COUNT(*) FROM "User"`,
      avg_reservations_per_user: `
        SELECT ROUND(AVG(cnt),2) AS avg
        FROM (SELECT COUNT(r.reservationid) AS cnt FROM "User" u
              LEFT JOIN reservation r ON u.userid = r.userid
              GROUP BY u.userid) t`,
      business_occupied: `SELECT COUNT(*) FROM seat WHERE classtype='Business' AND status='occupied'`,
      economy_occupied: `SELECT COUNT(*) FROM seat WHERE classtype='Economy' AND status='occupied'`,
      business_free: `SELECT COUNT(*) FROM seat WHERE classtype='Business' AND status='available'`,
      economy_free: `SELECT COUNT(*) FROM seat WHERE classtype='Economy' AND status='available'`,
      modified: `SELECT COUNT(*) FROM modification`,
      cancelled: `SELECT COUNT(*) FROM reservation WHERE status='cancelled'`
    };

    const results = {};
    for (const [key, sql] of Object.entries(queries)) {
      const { rows } = await pool.query(sql);
      results[key] = Number(rows[0].count || rows[0].avg || 0);
    }

    res.json(results);
  } catch (err) {
    console.error("❌ Error en reportes:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

