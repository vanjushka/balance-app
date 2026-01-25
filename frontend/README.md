# Balance – Fullstack Web App (Docker Setup)

This project is a fullstack web application consisting of:

- **Frontend:** Next.js (React)
- **Backend:** Laravel (PHP)
- **Database:** MySQL
- **Web Server:** Nginx
- **Auth:** Laravel Sanctum (cookie-based, SPA)

The project is fully containerized with Docker to ensure a reproducible setup for review and handover.

---

## Requirements

- Docker Desktop (macOS / Windows / Linux)

No local Node, PHP, Composer or MySQL installation required.

---

## Project Structure

```
.
├── frontend/          # Next.js frontend
├── backend/           # Laravel backend
├── docker/            # Nginx config
├── docker-compose.yml
└── README.md
```

---

## Local Setup (Docker)

### 1. Start the project

From the project root:

```bash
docker compose up -d
```

This will start:

- MySQL database
- Laravel backend (PHP-FPM)
- Nginx reverse proxy
- Next.js frontend (dev mode)

---

### 2. Database setup (first run only)

Run migrations and seed the database:

```bash
docker compose exec backend php artisan migrate --seed
```

---

## Access the Application

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend / API:** [http://localhost:8080](http://localhost:8080)

---

## Authentication

The application uses **Laravel Sanctum (SPA / session-based authentication)**.

Cookies and CORS are preconfigured for:

- `http://localhost:3000`
- `http://localhost:8080`

No manual token handling is required.

### Demo Login (Seeder)

> ⚠️ The demo user is created **only after running the database seeders**.
> Make sure you have executed:
>
> ```bash
> docker compose exec backend php artisan migrate --seed
> ```

You can then log in with the demo user:

- **Email:** `demo@balance.test`
- **Password:** `password`

---

## Useful Commands

Stop containers:

```bash
docker compose down
```

Rebuild containers (if dependencies change):

```bash
docker compose build --no-cache
docker compose up -d
```

View logs:

```bash
docker compose logs -f
```

---

## Notes for Reviewers

- The project is designed to run **entirely via Docker**
- No environment-specific setup is required beyond Docker Desktop
- All services communicate via Docker networking
- The setup is suitable for local development and handover
- A production setup can be added separately if required

### Top-level domain requirement

The app runs at top-level ports (no subfolder):

- Frontend: `http://localhost:3000`
- Backend/API: `http://localhost:8080`

---

## Notes for Reviewers

- The project is designed to run **entirely via Docker**
- No environment-specific setup is required beyond Docker Desktop
- All services communicate via Docker networking
- The setup is suitable for local development and handover
- A production setup can be added separately if required

### Top-level domain requirement

The app runs at top-level ports (no subfolder):

- Frontend: `http://localhost:3000`
- Backend/API: `http://localhost:8080`

---

## Author

Vanja
