
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "appointments.db"));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS appointment_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 3
      CHECK (max_capacity = 3),
    UNIQUE (slot_date, start_time)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    notes TEXT DEFAULT '',
    slot_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'booked'
      CHECK (status IN ('booked', 'cancelled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES appointment_slots(id)
  );

  CREATE INDEX IF NOT EXISTS idx_appointments_slot_status
  ON appointments(slot_id, status);
`);

module.exports = db;