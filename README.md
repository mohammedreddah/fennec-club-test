# Fennec Club

A web application for managing a taekwondo club: athlete registration and categories, coach-led attendance tracking, and administrative document tracking.

This app is fully self-hosted: a plain PostgreSQL database, an Express API with its own JWT-based authentication, and a React frontend. There is no dependency on any third-party backend-as-a-service — everything runs on your own VPS.

## Project description

Fennec Club digitizes four core workflows for a taekwondo club:

- **Athlete registration and categories** — admins manage athlete profiles and the categories (e.g. Children, Cadets, Juniors, Seniors) they train in.
- **Attendance tracking** — coaches start a session for one of their assigned categories, mark each athlete present or absent, and submit it. Admins can review and correct any session.
- **Administrative document tracking** — admins define folders of required documents (e.g. a "Registration Folder" containing a birth certificate, medical certificate, etc.). Coaches and admins check off each document as received per athlete. No file uploads are involved — this only tracks whether a document was handed in.
- **Coach and admin management** — admins create and manage coach and admin accounts, assign one or more categories to each coach, and reset any account's password.
- **Excel import/export** — admins can export the athlete and coach lists to `.xlsx`, and bulk-import new athletes or coaches from a spreadsheet.
- **Multilingual interface** — the app is available in Arabic (default, right-to-left), French, and English, switchable at any time from the sidebar or login screen.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), React Router, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | Plain PostgreSQL (no ORM — parameterized SQL via `pg`) |
| Authentication | Self-issued JWTs + bcrypt password hashing (no external auth provider) |
| Hosting | Any Linux VPS — Nginx as reverse proxy/static host, PM2 or systemd to run the API |

Prisma is intentionally **not** used. The backend talks to Postgres directly through the `pg` driver with hand-written SQL in `server/src/services/`.

## Project structure

```text
fennec-club/
├── client/                      # React frontend (Vite)
│   ├── src/
│   │   ├── api/                 # Axios client + one module per resource, JWT token storage
│   │   ├── components/          # Shared UI: Layout, Modal, ConfirmDialog, ProtectedRoute...
│   │   ├── context/              # AuthContext (JWT session) and ToastContext
│   │   ├── i18n/                 # Arabic/French/English translations
│   │   └── pages/
│   │       ├── admin/            # Admin dashboard and management pages
│   │       └── coach/            # Coach dashboard, attendance, documents
│   └── .env.example
├── server/                       # Express backend
│   ├── scripts/
│   │   └── createAdmin.js        # CLI script to bootstrap the first admin account
│   └── src/
│       ├── config/               # PostgreSQL connection pool (db.js)
│       ├── middleware/           # JWT auth, role-based access, validation, error handling
│       ├── routes/               # One router per resource
│       ├── controllers/          # Thin HTTP layer
│       ├── services/             # Business logic + raw SQL queries
│       └── utils/                # jwt.js (sign/verify), password.js (bcrypt)
│   └── .env.example
├── database/
│   └── schema.sql                # Full PostgreSQL schema — run this once
└── README.md
```

## Prerequisites (on your VPS)

- Ubuntu/Debian (or similar) VPS with root or sudo access
- Node.js 18 or later
- npm 9 or later
- PostgreSQL 14 or later
- Nginx (recommended, for serving the frontend build and reverse-proxying the API)
- A process manager for the API — PM2 is used in this guide (systemd works equally well)

## 1. Install PostgreSQL and create the database

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib

sudo -u postgres psql -c "CREATE USER fennec_user WITH PASSWORD 'choose-a-strong-password';"
sudo -u postgres psql -c "CREATE DATABASE fennec_club OWNER fennec_user;"
sudo -u postgres psql -d fennec_club -c "GRANT ALL ON SCHEMA public TO fennec_user;"
```

## 2. Run the schema

From the project root, with `psql` pointed at your new database:

```bash
psql "postgresql://fennec_user:choose-a-strong-password@localhost:5432/fennec_club" -f database/schema.sql
```

This creates all tables, constraints, indexes, and triggers. It does **not** insert any categories, folders, or documents, and it does not create any login accounts — you create the first admin in step 5, and everything else from the app itself.

## 3. Backend environment setup

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=5000
CLIENT_URL=https://your-domain.com
DATABASE_URL=postgresql://fennec_user:choose-a-strong-password@localhost:5432/fennec_club
DATABASE_SSL=false
JWT_SECRET=<generate with: openssl rand -base64 48>
JWT_EXPIRES_IN=7d
```

`JWT_SECRET` is what signs every login session — treat it like a password and never commit it. `DATABASE_SSL` should stay `false` for a local Postgres install on the same VPS; set it to `true` only if you're connecting to a managed/remote Postgres that requires SSL.

## 4. Backend installation

```bash
cd server
npm install
```

## 5. Create the first admin account

There's no public sign-up page. Bootstrap the first admin directly with the included script:

```bash
cd server
npm run create-admin -- --email=admin@yourclub.com --password=YourStrongPassword123 --name="Head Admin"
```

This hashes the password with bcrypt and inserts the account directly into Postgres. Log in with that email/password once the app is running, then create every other coach and admin account from the UI.

## 6. Run the backend

For local development:

```bash
cd server
npm run dev
```

For production, keep it running with PM2:

```bash
npm install -g pm2
cd server
pm2 start src/server.js --name fennec-api
pm2 save
pm2 startup   # follow the printed instructions to enable it on boot
```

## 7. Frontend environment setup and build

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=https://your-domain.com/api
```

Then build:

```bash
cd client
npm install
npm run build
```

This produces a static `client/dist/` folder — that's what Nginx will serve.

## 8. Nginx configuration

A minimal setup serving the built frontend and proxying `/api` to the Node backend:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/fennec-club/client/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Reload Nginx (`sudo systemctl reload nginx`), then put HTTPS in front of this with [Certbot](https://certbot.eff.org/) (`sudo certbot --nginx -d your-domain.com`) — the app sends passwords and JWTs over the network, so it should not run in production without TLS.

## Roles

- **Admin** — full access: manage coaches, admins, athletes, categories, coach-category assignments, all attendance history, document folders and requirements, every athlete's document status, password resets, and Excel import/export.
- **Coach** — scoped access: can only see athletes and attendance in the categories assigned to them. Can start and submit attendance sessions, edit sessions they created, view their athletes' required documents, and mark documents received/not received. Coaches cannot upload files or manage folders/categories/accounts.

Every protected backend route re-checks the caller's role by reloading their profile from the database on each request — the frontend UI hiding a button is never the only line of defense, and there's no database-level access layer (like RLS) to lean on either, since Postgres is only ever queried by the trusted Express process.

## Development commands

```bash
# backend
cd server && npm run dev

# frontend
cd client && npm run dev
```

## Build commands

```bash
# frontend production build
cd client && npm run build
npm run preview   # preview the production build locally
```

The backend has no build step — `npm start` runs the server directly with Node.

## Troubleshooting

**"Missing DATABASE_URL" or "Missing JWT_SECRET" in the server logs**
Double-check `server/.env` exists and matches `server/.env.example`, with no quotes around values.

**Frontend shows a blank page or CORS errors in the browser console**
Make sure `CLIENT_URL` in `server/.env` matches the exact origin the frontend is served from (protocol + domain), and that `VITE_API_URL` in `client/.env` points at the correct backend path.

**"This account has been deactivated" on login**
An admin has deactivated that account from the Coaches/Admins page.

**401 errors after refreshing the page**
The JWT is stored in the browser's `localStorage` and sent on every request; if you see this, check that the token hasn't expired (`JWT_EXPIRES_IN` in `server/.env`) or that `server/.env`'s `JWT_SECRET` hasn't changed since the token was issued (changing the secret invalidates all existing sessions — everyone will need to log in again).

**"duplicate key value violates unique constraint" when submitting attendance**
This means an attendance record already exists for that athlete in that session. Edit the existing session instead of creating a new one for the same date/category/coach.

**Category deletion fails**
Categories with athletes still assigned to them cannot be deleted — reassign or remove those athletes first.

**Excel import fails for every row**
The importer matches the `category` column by exact category name (case-insensitive) against categories that already exist in the app — create the category first, then import. For athletes, `first_name`, `last_name`, `date_of_birth` (YYYY-MM-DD), `guardian_name`, and `guardian_phone` are required columns. For coaches, `full_name` and `email` are required; if a `password` column isn't provided (or is under 8 characters), a random password is generated and shown to you after the import completes so you can share it with the coach.

**Can a coach see athletes outside their assigned categories?**
No — every athlete, attendance, and document endpoint scopes coach requests to their assigned categories inside the Express service layer, regardless of what the frontend requests.

**I need to reset the JWT secret / force everyone to log out**
Change `JWT_SECRET` in `server/.env` and restart the backend. Every existing token becomes invalid immediately, and everyone will need to log in again.
