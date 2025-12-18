# Commissioner Engagement Management System (CEMS)

Secure, role-based platform for managing commissioner engagements. Stack: Express.js, React (Vite), Sequelize + MySQL, JWT + bcrypt, Tailwind CSS.

## Project layout
- `backend/`: REST API with RBAC, JWT auth, audit logging.
- `frontend/`: React SPA with role-aware UI for engagements.

## Prerequisites
- Node.js 18+
- MySQL 8+ running and reachable

## Backend setup
```bash
cd backend
cp env.example .env   # update DB credentials & JWT_SECRET
npm install
npm run dev           # starts on port 4000 by default
```

Key environment variables (`backend/env.example`):
- `PORT` API port (default 4000)
- `JWT_SECRET` signing key
- `DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS` MySQL connectivity
- `ALLOWED_ORIGINS` comma-separated origins for CORS

## Frontend setup
```bash
cd frontend
npm install
npm run dev           # starts on port 5173
```
Configure `VITE_API_URL` in a `.env` file (e.g., `http://localhost:4000/api`).

## Core API routes
- `POST /api/auth/register` – create user (role defaults to officer)
- `POST /api/auth/login`
- `GET /api/engagements` – list engagements (restricted by role)
- `POST /api/engagements` – create (admin, secretariat, departmentUser only)
- `PATCH /api/engagements/:id/status` – update status (admin, commissioner, secretariat)
- `GET /api/users` – list users (admin/commissioner)
- `PATCH /api/users/:id/status` – set status (admin)

## Role-based permissions

### Engagement Creation
- **System Administrator (admin)**: Can create engagements
- **Secretariat / Commissioner Assistant**: Can create engagements
- **Department User (Internal)**: Can create engagement requests
- **Commissioner**: **CANNOT** create engagements (only views and manages assigned ones)
- **Auditor**: Read-only access, cannot create engagements

## Security & auditing
- JWT authentication with bcrypt-hashed passwords.
- RBAC enforced via middleware.
- Audit logs captured for mutating routes with execution metadata.
- Helmet + CORS + structured logging enabled.

## Notes
- Database tables are auto-synced on startup.
- Default roles are seeded on boot: admin, commissioner, officer, viewer.
- Avoid checking secrets into version control; use `.env`.

