# Balance – Fullstack Web App

**Modul:** Portfolio – Creative Studio 1: Industry Workflows  
**Studentin:** Vanja Dunkel  
**Schule:** SAE Zürich  
**Jahr:** 2026

---

## Projektübersicht

**Balance** ist eine Fullstack-Webanwendung zur achtsamen Selbstbeobachtung im gesundheitlichen Kontext.
Die App unterstützt Nutzerinnen dabei, Symptome und Stimmungen regelmäßig zu dokumentieren und ihre persönlichen Muster über Reports besser zu verstehen.

Ein zentrales Feature der Anwendung ist die **automatisierte Auswertung von Symptomdaten**, welche mithilfe eines externen KI-Services erfolgt. Dieses Feature ist **integraler Bestandteil der Applikation** und **nicht optional**.

Das Projekt wurde als **Single Page Application (SPA)** umgesetzt und folgt einem **modernen Industrie-Workflow** mit klarer Trennung von Frontend und Backend.

---

## Tech-Stack (Kurzüberblick)

- **Frontend:** Next.js (React)
- **Backend:** Laravel (API)
- **Datenbank:** MySQL
- **Authentifizierung:** Laravel Sanctum (Cookie / Session-based)
- **Containerisierung:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **KI-Integration:** OpenAI API (serverseitig im Backend)

---

## Projektstruktur

```
/
├─ frontend/        # Next.js Frontend
├─ backend/         # Laravel Backend
├─ docker/          # Nginx-Konfiguration
├─ docker-compose.yml
└─ README.md        # Dieses Dokument
```

---

## Voraussetzungen

- **Docker Desktop** (inkl. Docker Compose)

Es ist **keine lokale PHP-, Node- oder MySQL-Installation** erforderlich.

---

## Installation & Start

### 1️⃣ Projekt starten

Im Projekt-Root:

```bash
docker compose up --build
```

Dadurch werden alle Services (Datenbank, Backend, Frontend, Nginx) gestartet.

---

### 2️⃣ Datenbank migrieren & Seeder ausführen

Der Demo-User wird **nur durch die Seeder erstellt**.

```bash
docker compose exec backend php artisan migrate --seed
```

---

## Zugriff auf die Anwendung

- **Frontend:** http://localhost:3000
- **Backend / API:** http://localhost:8080

> Die Anwendung läuft auf **Top-Level Domains** (kein Subfolder), wie in den Abgabeanforderungen gefordert.

---

## Demo Login (Seeder)

Nach dem Ausführen der Seeder kannst du dich mit folgendem Test-Account einloggen:

- **Email:** `demo@balance.test`
- **Passwort:** `password`

---

## OpenAI API Key (erforderlich)

Für die Generierung von AI-basierten Reports wird ein OpenAI API Key benötigt.

1️⃣ Kopiere die Beispiel-Umgebungsdatei:

```bash
cp .env.example .env
```

2️⃣ Ergänze in der `.env` den folgenden Wert:

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

> Der API Key wird **nicht versioniert**, ist in `.gitignore` ausgeschlossen und wird ausschließlich lokal verwendet.  
> Die Anwendung ist ohne gesetzten API Key lauffähig, jedoch **ohne AI-basierte Report-Generierung**.

---

## Hinweise für Reviewer

- Die Anwendung ist vollständig **Docker-basiert**
- Alle Services kommunizieren über Docker Networking
- Es wird ein **Session-/Cookie-basierter Auth-Flow** verwendet (keine Tokens)
- Die OpenAI-Integration läuft **ausschließlich serverseitig**
- Die App ist **Mobile First** und vollständig responsiv umgesetzt
- Nutzerinnen können:
    - sich registrieren
    - Inhalte erstellen
    - mit anderen Inhalten interagieren
    - ihren Account selbst löschen (inkl. aller zugehörigen Daten)

---

## Projektkontext (Modul)

Dieses Projekt wurde im Rahmen des Moduls  
**Creative Studio 1: Industry Workflows** entwickelt.

Der Fokus lag auf:

- agiler Feature-Planung
- industrierelevanten Workflows
- sauberer Trennung von Frontend & Backend
- reflektierter technischer Entscheidungsfindung
- praxisnaher Umsetzung einer Fullstack-Web-App

Zeitplanung, Feature-Tickets, Usability-Tests und Reflexionen sind Teil des Portfolios und der Präsentation.

---

© 2026 **Vanja Dunkel** – SAE Zürich  
Erstellt als Portfolio-Projekt im Studiengang Web Design & Development
