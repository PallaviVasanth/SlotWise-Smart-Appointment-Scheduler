
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const getSlot = db.prepare(`
  SELECT s.*,
    (SELECT COUNT(*) FROM appointments a
     WHERE a.slot_id = s.id AND a.status = 'booked') AS bookings
  FROM appointment_slots s
  WHERE s.id = ?
`);

function validDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
}

function ensureSlots(date) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO appointment_slots
      (slot_date, start_time, end_time, max_capacity)
    VALUES (?, ?, ?, 3)
  `);

  const transaction = db.transaction(() => {
    for (let minutes = 9 * 60; minutes < 17 * 60; minutes += 30) {
      const start = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      const endMinutes = minutes + 30;
      const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      insert.run(date, start, end);
    }
  });

  transaction();
}


function validCustomer(body) {
  return (
    typeof body.name === "string" &&
    body.name.trim().length >= 2 &&
    body.name.trim().length <= 100 &&
    typeof body.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) &&
    typeof body.phone === "string" &&
    /^[6-9]\d{9}$/.test(body.phone.trim()) &&
    (body.notes === undefined ||
      (typeof body.notes === "string" && body.notes.length <= 500))
  );
}

function publicAppointment(id) {
  return db.prepare(`
    SELECT a.id, a.customer_name AS name, a.email, a.phone,
      a.notes, a.status, a.created_at, s.slot_date AS date,
      s.start_time AS startTime, s.end_time AS endTime, s.id AS slotId
    FROM appointments a
    JOIN appointment_slots s ON s.id = a.slot_id
    WHERE a.id = ?
  `).get(id);
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Appointment API is running" });
});

app.get("/api/slots", (req, res) => {
  const { date } = req.query;

  if (!validDate(date)) {
    return res.status(400).json({ error: "Provide a valid date in YYYY-MM-DD format." });
  }

  try {
    ensureSlots(date);

    const slots = db.prepare(`
      SELECT s.id, s.slot_date AS date,
        s.start_time AS startTime, s.end_time AS endTime,
        s.max_capacity AS capacity,
        COUNT(a.id) AS bookings,
        s.max_capacity - COUNT(a.id) AS remaining
      FROM appointment_slots s
      LEFT JOIN appointments a
        ON a.slot_id = s.id AND a.status = 'booked'
      WHERE s.slot_date = ?
      GROUP BY s.id
      ORDER BY s.start_time
    `).all(date);

    res.json(slots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load appointment slots." });
  }
});

app.get("/api/appointments", (req, res) => {
  try {
    const { date } = req.query;

    if (date && !validDate(date)) {
      return res.status(400).json({ error: "Invalid date." });
    }

    const sql = `
      SELECT a.id, a.customer_name AS name, a.email, a.phone,
        a.notes, a.status, a.created_at, s.slot_date AS date,
        s.start_time AS startTime, s.end_time AS endTime, s.id AS slotId
      FROM appointments a
      JOIN appointment_slots s ON s.id = a.slot_id
      ${date ? "WHERE s.slot_date = ?" : ""}
      ORDER BY s.slot_date DESC, s.start_time, a.id
    `;

    res.json(date ? db.prepare(sql).all(date) : db.prepare(sql).all());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load appointments." });
  }
});

const createAppointment = db.transaction((customer, slotId, excludeId = -1) => {
  const slot = getSlot.get(slotId);
  if (!slot) {
    const error = new Error("Appointment slot not found.");
    error.status = 404;
    throw error;
  }

  const activeCount = db.prepare(`
    SELECT COUNT(*) AS count FROM appointments
    WHERE slot_id = ? AND status = 'booked' AND id != ?
  `).get(slotId, excludeId).count;

  if (activeCount >= slot.max_capacity) {
    const error = new Error("This slot is fully booked. Please select another slot.");
    error.status = 409;
    throw error;
  }

  return db.prepare(`
    INSERT INTO appointments (customer_name, email, phone, notes, slot_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(customer.name.trim(), customer.email.trim(),
    customer.phone.trim(), (customer.notes || "").trim(), slotId).lastInsertRowid;
});

app.post("/api/appointments", (req, res) => {
  const { name, email, phone, notes, slotId } = req.body;

  if (!validCustomer({ name, email, phone, notes }) ||
      !Number.isInteger(slotId) || slotId < 1) {
    return res.status(400).json({
      error: "Enter a valid name, email, phone number, and appointment slot."
    });
  }

  try {
    const id = createAppointment(req.body, slotId);
    res.status(201).json(publicAppointment(id));
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.status ? error.message : "Could not create appointment."
    });
  }
});

app.put("/api/appointments/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, email, phone, notes, slotId } = req.body;

  if (!Number.isInteger(id) || id < 1 ||
      !validCustomer({ name, email, phone, notes }) ||
      !Number.isInteger(slotId) || slotId < 1) {
    return res.status(400).json({ error: "Invalid appointment details." });
  }

  try {
    const existing = db.prepare(
      "SELECT * FROM appointments WHERE id = ?"
    ).get(id);

    if (!existing || existing.status !== "booked") {
      return res.status(404).json({ error: "Active appointment not found." });
    }

    const update = db.transaction(() => {
      const slot = getSlot.get(slotId);
      if (!slot) {
        const error = new Error("Appointment slot not found.");
        error.status = 404;
        throw error;
      }

      if (slotId !== existing.slot_id) {
        const count = db.prepare(`
          SELECT COUNT(*) AS count FROM appointments
          WHERE slot_id = ? AND status = 'booked'
        `).get(slotId).count;

        if (count >= slot.max_capacity) {
          const error = new Error("The selected slot is fully booked.");
          error.status = 409;
          throw error;
        }
      }

      db.prepare(`
        UPDATE appointments
        SET customer_name = ?, email = ?, phone = ?, notes = ?, slot_id = ?
        WHERE id = ? AND status = 'booked'
      `).run(name.trim(), email.trim(), phone.trim(),
        (notes || "").trim(), slotId, id);
    });

    update();
    res.json(publicAppointment(id));
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.status ? error.message : "Could not update appointment."
    });
  }
});

app.patch("/api/appointments/:id/cancel", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid appointment ID." });
  }

  try {
    const result = db.prepare(`
      UPDATE appointments SET status = 'cancelled'
      WHERE id = ? AND status = 'booked'
    `).run(id);

    if (!result.changes) {
      return res.status(404).json({
        error: "Active appointment not found or already cancelled."
      });
    }

    return res.json({ message: "Appointment cancelled successfully." });
  } catch (error) {
    console.error("Could not cancel appointment:", error);
    return res.status(500).json({ error: "Could not cancel appointment." });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600
    ? err.status
    : 500;
  res.status(status).json({
    error: status === 400 ? "Invalid request body." : "Unexpected server error."
  });
});

app.listen(PORT, () => {
  console.log(`Appointment API running at http://localhost:${PORT}`);
});