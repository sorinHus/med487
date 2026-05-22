# MED487 — Family Medicine Practice Management App

A full-stack web application for managing a family medicine practice, built under a commercial contract. Covers the complete clinical workflow: patient records, appointments, consultations, prescriptions, referrals, medical leave, CNAS reporting, and a patient-facing portal.

> | | Link |
> |---|---|
> | 🌐 Presentation site | [med487.pages.dev](https://med487.pages.dev) |
> | 🖥️ Desktop app | [med487.pages.dev/app](https://med487.pages.dev/app) |
> | 📱 Mobile PWA | [med487.pages.dev/mobil](https://med487.pages.dev/mobil) |
>
> Demo credentials
Doctor
ion.popescu / Ion2026!
Assistant
andra.vasilescu / Andra2026!
Patient
1700912567890 / Pacient2026!

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python · Django 6.0.3 · Django REST Framework |
| Database | PostgreSQL (Railway) |
| Authentication | JWT via simplejwt — httpOnly cookies (access 8h · refresh 7 days) |
| Frontend | React 19 · Vite 8 · React Router · Axios · Recharts |
| Styling | CSS Modules · CSS custom properties (dark/light theme) |
| Storage | Cloudflare R2 (patient documents) |
| Email | Resend (anymail) |
| Deploy | Railway (backend) · Cloudflare Pages (frontend) |

---

## Features

### Clinical workflow
- **Patients** — full CRUD, Romanian CNP validation, address with county/locality dropdowns (42 counties, 13,812 localities), configurable table columns, Excel import/export
- **Consultations** — per-patient history, ICD-10 integration (1,009 codes), primary + secondary diagnoses
- **Appointments** — weekly/monthly calendar, free-slot engine, public online booking page, email notifications, Romanian legal holiday blocking, configurable weekly schedule per day
- **Prescriptions** — line-item model, auto-numbering (RX00001/2026), browser print template
- **Referrals** — specialist referrals, simple template + CNAS official form
- **Medical leave** — full CNAS model, dot-matrix print template with calibration mode, XML Annex 010 export

### Reporting & compliance
- **CNAS XML exports** — Annex 006 (consultations) and Annex 010 (medical leave), monthly
- **Dashboard** — charts (Recharts), monthly statistics per consultation type
- **Activity logs** — full audit trail per user action (superadmin only)

### Patient portal
- Public self-registration with doctor approval step
- Portal view: upcoming appointments, past consultations, active prescriptions
- Username = CNP (Romanian national ID number)
- Password reset by username (public endpoint, rate-limited)

### Mobile PWA
- Installable Progressive Web App at `/mobil`
- Daily appointment list with status actions (confirm / cancel / complete)
- Add and edit appointments from mobile
- File upload from mobile camera
- Auto-logout on JWT expiry
- Superadmin panel accessible from mobile

### Platform
- **Module system** — per-user active module management; sidebar filtered by active modules
- **Superadmin panel** — user management, module activation, global settings (cabinet info, slot duration, maintenance mode, weekly schedule, public holiday management)
- **Dark / light theme** — CSS variables toggle, persisted per user
- **Public presentation site** — hero, services, schedule (loaded from DB), contact; separate from the app
- **Color-coded calendar slots** — availability visible on the public booking page
- **Responsive design** — desktop, tablet, mobile breakpoints across all components

---

## Architecture

```
Browser (React/Vite — Cloudflare Pages)
        │  HTTPS · JSON · httpOnly cookies
        ▼
Django 6 + DRF (Railway)
        │  ORM
        ▼
PostgreSQL (Railway)

Patient documents → Cloudflare R2
Emails           → Resend (via anymail)
```

**Auth flow:** JWT stored in httpOnly cookies (`access` + `refresh`). The access token is read server-side via a custom `CookieJWTAuthentication` class. Axios sends cookies automatically (`withCredentials: true`). On 401 the interceptor silently calls `/api/token/refresh/`; if that also fails it dispatches an `auth:session-expired` event that clears React state without a page reload. Auto-logout after 2h inactivity. In development a Vite proxy forwards `/api` to Django so cookies remain same-origin.

---

## API Endpoints (selected)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Login — sets access + refresh cookies |
| POST | `/api/token/refresh/` | Refresh access token cookie |
| POST | `/api/logout/` | Clear auth cookies |
| GET/POST | `/api/pacienti/` | List / create patients |
| POST | `/api/import-pacienti/` | Bulk import from Excel |
| GET/POST | `/api/programari/` | List / create appointments |
| GET | `/api/zile-libere/?year=YYYY` | Romanian legal holidays |
| GET/POST | `/api/consultatii/` | List / create consultations |
| GET/POST | `/api/retete/` | List / create prescriptions |
| GET | `/api/retete/{id}/print/` | Prescription print template |
| GET/POST | `/api/concedii/` | List / create medical leave |
| GET | `/api/concedii/{id}/print/` | Medical leave print (+ `?calibrare`) |
| GET/POST | `/api/trimiteri/` | List / create referrals |
| GET | `/api/trimiteri/{id}/print/?tip=cnas` | CNAS referral form |
| GET | `/api/export-xml/?luna=&an=` | CNAS XML Annex 006 |
| GET | `/api/export-xml-concedii/?luna=&an=` | CNAS XML Annex 010 |
| GET | `/api/portal-pacient/` | Patient portal data |
| POST | `/api/inregistrare/` | Patient self-registration (public) |
| GET | `/api/loguri/` | Activity logs (superadmin) |

---

## Project Structure

```
med487/
├── backend/
│   ├── settings.py
│   └── urls.py
├── pacienti/                        # Main app
│   ├── models.py                    # 12 models
│   ├── serializers.py
│   ├── authentication.py            # CookieJWTAuthentication
│   ├── views.py                     # Re-export shim
│   ├── views_auth.py                # Login, refresh, logout
│   ├── views_utils.py               # log_actiune, LUNI_RO
│   ├── views_pacienti.py            # Patients, consultations, documents
│   ├── views_programari.py          # Appointments, cabinet config
│   ├── views_clinical.py            # Prescriptions, referrals, medical leave, print views
│   ├── views_raportare.py           # CNAS XML exports
│   ├── views_users.py               # Users, portal, registration, approvals, logs
│   ├── urls.py
│   ├── migrations/
│   ├── fixtures/
│   │   └── diagnostice_fixture.json # 1,009 ICD-10 codes
│   └── templates/pacienti/          # Print templates
│       ├── reteta_print.html
│       ├── concediu_print.html
│       ├── trimitere_simpla_print.html
│       └── trimitere_cnas_print.html
└── frontend/
    ├── src/
    │   ├── App.jsx                  # Router + auth state + role guards
    │   ├── api.js                   # Axios instance + 401 interceptor
    │   ├── auth.js                  # login / logout helpers
    │   └── components/
    │       ├── Login.jsx
    │       ├── Layout.jsx
    │       ├── Dashboard.jsx
    │       ├── PacientList.jsx
    │       ├── PacientForm.jsx
    │       ├── PacientDetalii.jsx
    │       ├── AdresaFields.jsx
    │       ├── Programari.jsx
    │       ├── Consultatii.jsx
    │       ├── Rapoarte.jsx
    │       ├── ProfilMedic.jsx
    │       ├── CereriPacienti.jsx
    │       ├── PortalPacient.jsx
    │       ├── SitePrezentare.jsx
    │       ├── SuperadminPanel.jsx
    │       └── MobilApp.jsx         # PWA mobile
    └── public/
        └── manifest.json            # PWA manifest
```

---

## Development Status

| Phase | Description | Status |
|---|---|---|
| F1 | Foundation, auth, JWT, roles | ✅ Done |
| F2 | Patients CRUD, CNP validation, address | ✅ Done |
| F3 | Consultations, ICD-10, appointments | ✅ Done |
| F4 | Prescriptions, referrals, medical leave | ✅ Done |
| F5 | Dashboard, reports, module system | ✅ Done |
| F6 | Public site, superadmin panel, Railway + Cloudflare deploy | ✅ Done |
| F7 | Patient portal, PWA mobile, CNAS XML export | ✅ Done |
| F8 | CSS Modules refactor, responsive design, activity logs | ✅ Done |
| F9 | PWA auto-logout, calendar availability colors, Excel import | ✅ Done |
| F10 | JWT → httpOnly cookies, views.py split into domain modules | ✅ Done |

---

## Context

Built as a commercial project for a Romanian family medicine practice. Key constraints that shaped the design:

- **CNAS compliance** — Romanian national health insurance requires specific XML formats (Annex 006, 010) and print templates with precise field positioning for dot-matrix printers
- **CNP as identifier** — Romanian national ID number used for patient identity and as patient portal username
- **Modular pricing** — the module system reflects a commercial model where the practice pays per feature set
- **No local install** — doctor and staff access via browser only; no desktop software

---

## License

Private commercial project — all rights reserved.
