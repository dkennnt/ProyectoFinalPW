import express from "express";
import { pool } from "../db.js";
import { sendEmail } from "../email.service.js";
import multer from "multer";
import { XMLParser } from "fast-xml-parser";
import { create } from "xmlbuilder2";

const router = express.Router();

// ====== IMPORTAR CONFIGURACIONES PARA XML ======
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Crear una nueva reserva
 */
router.post("/", async (req, res) => {
  const { userid, passenger, seatid, luggage } = req.body;
  console.log("📩 Datos recibidos:", req.body);

  try {
    // Verificar asiento
    const seatRes = await pool.query("SELECT * FROM seat WHERE seatid = $1", [seatid]);
    const seat = seatRes.rows[0];
    if (!seat) return res.status(400).json({ error: "El asiento no existe" });
    if (seat.status === "occupied") return res.status(400).json({ error: "El asiento ya está ocupado" });

    // Crear pasajero si no existe
    const existingPassenger = await pool.query("SELECT * FROM passenger WHERE cui = $1", [passenger.cui]);
    if (existingPassenger.rows.length === 0) {
      await pool.query(
        "INSERT INTO passenger (cui, firstname, lastname) VALUES ($1, $2, $3)",
        [passenger.cui, passenger.firstname, passenger.lastname]
      );
    }

    // Verificar si el usuario ya es VIP
    const reservasCount = await pool.query(`SELECT COUNT(*) FROM reservation WHERE userid = $1`, [userid]);
    const totalReservas = parseInt(reservasCount.rows[0].count, 10);
    const isVIP = totalReservas >= 5;

    if (isVIP) {
      await pool.query(`UPDATE "User" SET isvip = true WHERE userid = $1`, [userid]);
    }

    // Calcular totalPrice con descuento si VIP
    const totalPrice = isVIP ? seat.price * 0.9 : seat.price;

    // Crear reserva
    const result = await pool.query(
      `INSERT INTO reservation (userid, cui, seatid, luggage, totalprice, reservationdate, status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'active')
       RETURNING reservationid`,
      [userid, passenger.cui, seatid, luggage, totalPrice]
    );

    // Actualizar asiento
    await pool.query("UPDATE seat SET status = 'occupied' WHERE seatid = $1", [seatid]);

    res.json({
      success: true,
      reservationid: result.rows[0].reservationid,
      totalprice: totalPrice,
      isvip: isVIP
    });
  } catch (err) {
    console.error("❌ Error en el servidor:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------- OBTENER RESERVAS POR USUARIO --------
router.get("/user/:userid", async (req, res) => {
  const { userid } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.reservationid, r.seatid, s.seatnumber, s.classtype, r.status, r.totalprice
       FROM reservation r
       JOIN seat s ON r.seatid = s.seatid
       WHERE r.userid = $1
       ORDER BY r.reservationid DESC`,
      [userid]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error al obtener reservas:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------- MODIFICAR ASIENTO --------
router.patch("/:id/change-seat", async (req, res) => {
  const { id } = req.params;
  const { newSeatId } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const oldRes = await client.query(
      `SELECT r.seatid AS oldseatid, s.price AS oldprice, r.status
       FROM reservation r
       JOIN seat s ON r.seatid = s.seatid
       WHERE r.reservationid = $1 FOR UPDATE`,
      [id]
    );

    if (oldRes.rowCount === 0)
      throw new Error("Reserva no encontrada");

    const oldSeat = oldRes.rows[0];
    if (oldSeat.status === 'cancelled') {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Esta reserva fue cancelada y no puede modificarse." });
    }

    const newSeatRes = await client.query(
      `SELECT seatid, price, status FROM seat WHERE seatid = $1 FOR UPDATE`,
      [newSeatId]
    );
    if (newSeatRes.rowCount === 0)
      throw new Error("El nuevo asiento no existe");

    const newSeat = newSeatRes.rows[0];
    if (newSeat.status !== "available")
      throw new Error("El nuevo asiento ya está ocupado");

    const fee = Math.ceil(Number(oldSeat.oldprice) * 0.10);

    await client.query(
      `UPDATE reservation
         SET seatid = $1, totalprice = totalprice + $2, status = 'modified'
       WHERE reservationid = $3`,
      [newSeatId, fee, id]
    );

    await client.query(`UPDATE seat SET status = 'available' WHERE seatid = $1`, [oldSeat.oldseatid]);
    await client.query(`UPDATE seat SET status = 'occupied' WHERE seatid = $1`, [newSeatId]);

    await client.query(
      `INSERT INTO modification (reservationid, oldseatid, newseatid, modificationdate, oldprice, fee)
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [id, oldSeat.oldseatid, newSeatId, oldSeat.oldprice, fee]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Asiento actualizado con fee del 10%" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error al cambiar asiento:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// -------- CANCELAR RESERVA --------
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const resv = await pool.query(`SELECT status FROM reservation WHERE reservationid = $1`, [id]);
    if (resv.rowCount === 0) return res.status(404).json({ error: "Reserva no encontrada" });
    if (resv.rows[0].status === 'cancelled')
      return res.status(400).json({ error: "Esta reserva ya está cancelada." });

    await pool.query(`UPDATE reservation SET status = 'cancelled' WHERE reservationid = $1`, [id]);
    res.json({ success: true, message: "Reserva cancelada correctamente" });
  } catch (err) {
    console.error("❌ Error al cancelar reserva:", err);
    res.status(500).json({ error: err.message });
  }
});

// -------- BUSCAR RESERVA --------
router.post("/search", async (req, res) => {
  const { reservationid, cui, name } = req.body;
  try {
    const result = await pool.query(
      `SELECT r.*, s.seatnumber, s.classtype, p.firstname, p.lastname
       FROM reservation r
       JOIN seat s ON r.seatid = s.seatid
       JOIN passenger p ON p.cui = r.cui
       WHERE r.reservationid = $1
       AND (p.cui = $2 OR LOWER(p.firstname || ' ' || p.lastname) LIKE LOWER($3))`,
      [reservationid, cui, `%${name}%`]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Reserva no encontrada o datos incorrectos." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error al buscar reserva:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== EXPORTAR RESERVAS A XML =====
router.get("/export-xml", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.seatnumber, p.firstname || ' ' || p.lastname AS passengername,
             u.email AS useremail, p.cui AS idnumber,
             CASE WHEN r.luggage > 0 THEN 'true' ELSE 'false' END AS hasluggage,
             to_char(r.reservationdate, 'DD/MM/YYYY HH24:MI') AS reservationdate
      FROM reservation r
      JOIN seat s ON r.seatid = s.seatid
      JOIN "User" u ON r.userid = u.userid
      JOIN passenger p ON r.cui = p.cui
      ORDER BY r.reservationid;
    `);

    const reservations = result.rows.map(r => ({
      flightSeat: {
        seatNumber: r.seatnumber,
        passengerName: r.passengername,
        user: r.useremail,
        idNumber: r.idnumber,
        hasLuggage: r.hasluggage,
        reservationDate: r.reservationdate
      }
    }));

    const doc = create({ version: "1.0", encoding: "UTF-8" })
      .ele("flightReservation")
      .ele(reservations)
      .end({ prettyPrint: true });

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Content-Disposition", "attachment; filename=reservations.xml");
    res.send(doc);
  } catch (err) {
    console.error("❌ Error al generar XML:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== IMPORTAR RESERVAS DESDE XML =====
router.post("/import-xml", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Debe subir un archivo XML válido." });

  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const xmlText = req.file.buffer.toString("utf-8");

  try {
    const start = performance.now();
    const xml = parser.parse(xmlText);

    const items = Array.isArray(xml?.flightReservation?.flightSeat)
      ? xml.flightReservation.flightSeat
      : [xml.flightReservation.flightSeat];

    let inserted = 0, errors = 0;

    for (const item of items) {
      try {
        const seatNumber = item.seatNumber;
        const [firstname, lastname] = item.passengerName.split(" ");
        const email = item.user;
        const cui = item.idNumber;
        const hasLuggage = item.hasLuggage === "true";
        const reservationDate = item.reservationDate;

        const seatRes = await pool.query(`SELECT seatid FROM seat WHERE seatnumber = $1`, [seatNumber]);
        if (seatRes.rowCount === 0) throw new Error(`Asiento ${seatNumber} no existe`);
        const seatid = seatRes.rows[0].seatid;

        let userRes = await pool.query(`SELECT userid FROM "User" WHERE email=$1`, [email]);
        let userid;
        if (userRes.rowCount === 0) {
          const newUser = await pool.query(
            `INSERT INTO "User"(name,email,password,isvip) VALUES($1,$2,'xmlimport',false) RETURNING userid`,
            [`${firstname} ${lastname}`, email]
          );
          userid = newUser.rows[0].userid;
        } else userid = userRes.rows[0].userid;

        const passengerRes = await pool.query(`SELECT cui FROM passenger WHERE cui=$1`, [cui]);
        if (passengerRes.rowCount === 0) {
          await pool.query(`INSERT INTO passenger(cui,firstname,lastname) VALUES($1,$2,$3)`, [cui, firstname, lastname]);
        }

        await pool.query(
          `INSERT INTO reservation(userid,cui,seatid,luggage,totalprice,reservationdate,status)
           VALUES ($1,$2,$3,$4,0,to_timestamp($5,'DD/MM/YYYY HH24:MI'),'active')`,
          [userid, cui, seatid, hasLuggage ? 1 : 0, reservationDate]
        );

        inserted++;
      } catch (err) {
        console.warn("⚠️ Error en asiento:", err.message);
        errors++;
      }
    }

    const time = Math.round(performance.now() - start);
    res.json({ success: true, importStats: { inserted, errors, time } });
  } catch (err) {
    console.error("❌ Error general al importar:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
