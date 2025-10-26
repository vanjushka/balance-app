# Balance Backend API

**Modul:** Portfolio – Back End Fundamentals  
**Studentin:** Vanja Dunkel  
**Schule:** SAE Zürich  
**Jahr:** 2025

---

## Projektübersicht

Die **Balance API** ist ein REST-basiertes Backend, entwickelt mit **Laravel**, für die Frauen-Wellness-App _Balance_.  
Sie ermöglicht Benutzer-Authentifizierung, das Erfassen und Auswerten von Symptomen, das Erstellen von Posts mit Likes und Kommentaren sowie das Generieren von ärztlichen PDF-Berichten.

---

## Tech-Stack

| Technologie         | Zweck                             |
| ------------------- | --------------------------------- |
| **Laravel 11**      | PHP-Framework für Backend-Logik   |
| **MySQL**           | Relationale Datenbank             |
| **Laravel Sanctum** | Token-basierte Authentifizierung  |
| **Barryvdh DomPDF** | PDF-Generierung                   |
| **Bruno**           | API-Testing                       |
| **DataGrip**        | Datenbank-Verwaltung und -Analyse |

---

## Installation

### 1️⃣ Repository klonen

```bash
git clone https://github.com/vanja-dunkel/balance_backend.git
cd balance
```

### 2️⃣ Abhängigkeiten installieren

```bash
composer install
```

### 3️⃣ `.env` konfigurieren

Dupliziere `.env.example` → umbenennen zu `.env`.  
Dann anpassen:

```
APP_NAME=Balance
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=balance_app
DB_USERNAME=root
DB_PASSWORD=dein_passwort
```

### 4️⃣ App-Key generieren

```bash
php artisan key:generate
```

### 5️⃣ Migrationen & Seeder ausführen

```bash
php artisan migrate:fresh --seed
```

### 6️⃣ Lokalen Server starten

```bash
php artisan serve
```

Die API läuft dann unter:  
👉 **http://127.0.0.1:8000**

---

## Authentifizierung (Laravel Sanctum)

Alle geschützten Routen benötigen ein gültiges **Bearer-Token**.

**Beispiel Login:**

```json
POST /api/login
{
  "email": "test@example.com",
  "password": "secret123"
}
```

**Antwort:**

```json
{
    "token": "1|abc123..."
}
```

Token in Bruno oder Postman als Header verwenden:

```
Authorization: Bearer 1|abc123...
```

---

## API-Endpunkte

### 🔸 Authentifizierung

| Methode | Endpoint           | Beschreibung               |
| ------- | ------------------ | -------------------------- |
| POST    | `/api/user`        | Benutzer registrieren      |
| POST    | `/api/login`       | Einloggen & Token erhalten |
| POST    | `/api/auth/logout` | Ausloggen                  |

---

### 🔸 Benutzerverwaltung

| Methode | Endpoint    | Beschreibung                 |
| ------- | ----------- | ---------------------------- |
| GET     | `/api/user` | Aktuellen Benutzer anzeigen  |
| PATCH   | `/api/user` | Benutzerprofil aktualisieren |
| DELETE  | `/api/user` | Benutzer löschen             |

---

### 🔸 Symptome

| Methode | Endpoint              | Beschreibung                  |
| ------- | --------------------- | ----------------------------- |
| GET     | `/api/symptoms`       | Alle Symptom-Einträge abrufen |
| GET     | `/api/symptoms/{id}`  | Einzelnen Eintrag anzeigen    |
| POST    | `/api/symptoms`       | Neuen Eintrag erstellen       |
| PATCH   | `/api/symptoms/{id}`  | Eintrag aktualisieren         |
| DELETE  | `/api/symptoms/{id}`  | Eintrag löschen               |
| GET     | `/api/symptoms/stats` | Statistik anzeigen            |

---

### 🔸 Posts

| Methode | Endpoint               | Beschreibung             |
| ------- | ---------------------- | ------------------------ |
| GET     | `/api/posts`           | Alle Posts abrufen       |
| GET     | `/api/posts/{id}`      | Einzelnen Post anzeigen  |
| POST    | `/api/posts`           | Neuen Post erstellen     |
| PATCH   | `/api/posts/{id}`      | Post aktualisieren       |
| DELETE  | `/api/posts/{id}`      | Post löschen             |
| POST    | `/api/posts/{id}/like` | Like / Unlike umschalten |

---

### 🔸 Kommentare

| Methode | Endpoint                       | Beschreibung                     |
| ------- | ------------------------------ | -------------------------------- |
| GET     | `/api/posts/{postId}/comments` | Kommentare zu einem Post abrufen |
| POST    | `/api/posts/{postId}/comments` | Kommentar hinzufügen             |
| PATCH   | `/api/comments/{id}`           | Kommentar aktualisieren          |
| DELETE  | `/api/comments/{id}`           | Kommentar löschen                |

---

### 🔸 Reports (PDF-Berichte)

| Methode | Endpoint                     | Beschreibung               |
| ------- | ---------------------------- | -------------------------- |
| GET     | `/api/reports`               | Alle Berichte abrufen      |
| GET     | `/api/reports/{id}`          | Einzelnen Bericht anzeigen |
| POST    | `/api/reports`               | Bericht erstellen (PDF)    |
| GET     | `/api/reports/{id}/download` | PDF herunterladen          |
| DELETE  | `/api/reports/{id}`          | Bericht löschen            |

---

## Beispiel: Bericht erstellen

**POST /api/reports**

```json
{
    "period_start": "2025-10-01",
    "period_end": "2025-10-25"
}
```

**Antwort:**

```json
{
    "data": {
        "id": 1,
        "user_id": 1,
        "period_start": "2025-10-01T00:00:00.000000Z",
        "period_end": "2025-10-25T23:59:59.000000Z",
        "file_path": "reports/1/report_1730000000.pdf",
        "generated_at": "2025-10-25T13:00:00.000000Z"
    }
}
```

Das PDF wird gespeichert unter:  
📂 `/storage/app/public/reports/...`

---

## Datenbankstruktur (vereinfacht)

```
users
 ├─ id, email, password, profile, is_admin

symptom_logs
 ├─ id, user_id, log_date, pain_intensity, energy_level, mood, notes

posts
 ├─ id, user_id, body, image_url

comments
 ├─ id, post_id, user_id, body

reports
 ├─ id, user_id, period_start, period_end, file_path, generated_at
```

---

## Test & Kontrolle

-   Alle Endpunkte wurden in **Bruno** erfolgreich getestet
-   **DataGrip** zeigt korrekt alle Tabellen und Relationen
-   **Server läuft lokal** mit `php artisan serve`
-   **PDF-Berichte** werden erfolgreich generiert und im `storage/public`-Verzeichnis gespeichert

---

## Lizenz

© 2025 **Vanja Dunkel** – SAE Zürich  
Erstellt für das Modul _Portfolio – Back End Fundamentals_.
