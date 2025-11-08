import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = express.Router();

// -------- REGISTRO --------
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!email.endsWith("@gmail.com") && !email.endsWith("@outlook.com")) {
    return res.status(400).json({ error: "Solo se permiten correos @gmail.com o @outlook.com" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO "User" (name, email, password, isvip)
       VALUES ($1, $2, $3, false)
       RETURNING userid, name, email, isvip`,
      [name, email, hashed]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------- LOGIN --------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(`SELECT * FROM "User" WHERE email = $1`, [email]);
    const user = result.rows[0];

    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    res.json({
      success: true,
      user: {
      userid: user.userid,
      name: user.name,
      email: user.email,
      isvip: user.isvip
      }
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
