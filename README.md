# SlotWise — Smart Appointment Scheduler

A full-stack appointment booking demo built with React, Vite, Node.js, Express, and SQLite.

## Features

- 16 half-hour slots per date, between 9:00 AM and 5:00 PM
- Maximum of 3 active bookings per slot
- View daily slot availability and appointment records
- Create, edit, and cancel appointments
- Client-side and server-side customer input validation
- SQLite persistence, foreign keys, and transaction-based booking capacity checks
- Capacity and booking summary cards
- Responsive layout and accessible labels/status messages

## Requirements

- Node.js 20.19+ or 22.12+ recommended for current Vite releases
- npm

## Run locally

Open two terminals from the project root.

### 1. Start the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` if you want to customize the port. Then run:

```bash
npm start
```

The API runs at `http://localhost:5000` by default. A new `appointments.db` database is created automatically in `backend/` on first run.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Optionally copy `.env.example` to `.env`. Then run:

```bash
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Keep both terminals running.

## API routes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/slots?date=YYYY-MM-DD` | Slot availability for a date |
| GET | `/api/appointments?date=YYYY-MM-DD` | Appointment list, optionally filtered by date |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/:id` | Edit an active appointment |
| PATCH | `/api/appointments/:id/cancel` | Cancel an active appointment |

## Project layout

```text
smart-appointment-scheduler/
├── backend/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Alert.jsx
│   │   │   ├── AppointmentsTable.jsx
│   │   │   ├── BookingForm.jsx
│   │   │   ├── SlotsPanel.jsx
│   │   │   └── StatsGrid.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## Notes and limitations

This is a demonstration app, not a production booking service. It currently has no user authentication/authorization, email notifications, deployment configuration, automated test suite, or production-grade request rate limiting. The API validates data and booking capacity, but a production version should also enforce the business rule that appointments cannot be booked for past dates on the server, configure a restricted CORS origin, and add automated integration/concurrency tests. Do not store real customer data in a public repository.
