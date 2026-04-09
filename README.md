# MED487 — Family Medicine Practice Management App

A web application for managing a family medicine practice. Built with Django 6 + DRF on the backend and React 19 + Vite on the frontend.

---

## Tech Stack

**Backend**
- Python / Django 6.0.3
- Django REST Framework
- PostgreSQL
- JWT Authentication (simplejwt — access 8h / refresh 7 days)
- django-filter, django-cors-headers, anymail (Resend), boto3 (Cloudflare R2), openpyxl, django-ratelimit

**Frontend**
- React 19 + Vite 8
- Axios 1.13
- React Router DOM
- Recharts
- CSS Modules (all components)
- Dark/light theme via CSS variables

---

## Implemented Features

- **Authentication** — JWT with automatic refresh, role-based access (superadmin / medic / asistent / pacient), auto logout after 2h inactivity
- **Patients** — Full CRUD, Romanian CNP validation, address with county/locality dropdowns (42 counties, 13,812 localities), sortable/filterable list, configurable columns, Excel import/export, `nume_anterior` field
- **Consultations** — Per-patient history, ICD-10 integration (1,009 codes), primary/secondary diagnoses
- **Appointments** — Weekly calendar with lunar view + free slots, public online booking, email notifications, legal holiday blocking, configurable weekly schedule, edit/cancel
- **Medical Prescriptions** — Line-item model, auto-numbering RX00001/2026, print/PDF template
- **Medical Leave** — Full CNAS form model, dot matrix print template with calibration mode, XML export (Anexa 010)
- **Referrals** — Specialist referral model, print templates (simple + CNAS)
- **CNAS Reporting** — XML export Anexa 006 (consultations) and Anexa 010 (medical leave)
- **Document Upload** — Per-patient file upload stored on Cloudflare R2; separate "Dosar scanat" and "Alte fișiere" sections
- **Doctor Profile** — Personal data + password change
- **Module System** — Per-user active module management, sidebar filtered by active modules
- **Superadmin Panel** — User management (CRUD + activate/deactivate), module activation, global settings (cabinet info, slot duration, maintenance mode, weekly schedule)
- **Patient Portal** — Self-registration with CNP-based username (family members sharing email supported), staff approval flow, portal with appointments/consultations/prescriptions (read-only)
- **Public Site** — Presentation site (light mode) with separate React Router pages (Home, About, Services, Schedule/Contact); hamburger menu on mobile; fully responsive
- **Public Booking** — Standalone HTML page (`programare.html`), blocks weekends + legal holidays, 30-day limit, slots from API; fully responsive; associates booking with logged-in patient account
- **Mobile PWA** — Installable PWA at `/mobil`; appointments view + status change + add/edit; file upload; superadmin panel; separate JWT token
- **Activity Logs** — Last 500 actions visible to superadmin, timestamps in Europe/Bucharest timezone
- **Rate Limiting** — Public endpoints protected via django-ratelimit
- **GDPR** — Privacy policy page, cookie consent banner

---

## Project Structure

```
cabinet-medical/
├── backend/
│   ├── settings.py
│   └── urls.py
├── pacienti/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── migrations/           # 0001–0020
│   ├── fixtures/
│   │   └── diagnostice_fixture.json   # 1,009 ICD-10 codes
│   └── templates/pacienti/
│       ├── reteta_print.html
│       ├── concediu_print.html
│       ├── trimitere_simpla_print.html
│       └── trimitere_cnas_print.html
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── sp/           # Site prezentare (SpLayout, HomePage, DesprePage, ServiciiPage, ProgramContactPage, PoliticaPage, CookieBanner)
│   │   │   ├── AdresaFields.jsx
│   │   │   ├── CereriPacienti.jsx
│   │   │   ├── Consultatii.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MobilApp.jsx
│   │   │   ├── PacientDetalii.jsx
│   │   │   ├── PacientForm.jsx
│   │   │   ├── PacientList.jsx
│   │   │   ├── PortalPacient.jsx
│   │   │   ├── ProfilMedic.jsx
│   │   │   ├── Programari.jsx
│   │   │   ├── Rapoarte.jsx
│   │   │   ├── SitePrezentare.jsx
│   │   │   └── SuperadminPanel.jsx
│   │   ├── styles/           # CSS Modules (ComponentName.module.css for each component; sp.module.css shared for sp/)
│   │   ├── utils/
│   │   │   ├── cnp.js
│   │   │   └── romania_geo.js
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── auth.js
│   └── public/
│       ├── programare.html   # Public booking (responsive, no auth required)
│       ├── inregistrare.html # Patient self-registration
│       ├── manifest.json     # PWA manifest
│       └── _redirects        # Cloudflare Pages SPA routing
└── .env
```

---

## Production Deploy

| Service | URL |
|---------|-----|
| Frontend | https://med487.pages.dev (Cloudflare Pages) |
| Backend | https://web-production-26811.up.railway.app (Railway) |
| DB | PostgreSQL on Railway |
| Storage | Cloudflare R2 (`med487-documente`) |

**Railway start command:**
```
python manage.py migrate && python manage.py loaddata pacienti/fixtures/diagnostice_fixture.json && gunicorn backend.wsgi --bind 0.0.0.0:$PORT --timeout 120 --workers 2
```

**Cloudflare Pages env:**
```
VITE_API_URL=https://web-production-26811.up.railway.app/api
```

---

## User Roles

| Role | Access |
|------|--------|
| `superadmin` | Platform administration: users, modules, global settings, activity logs |
| `medic` | Full application access |
| `asistent` | Limited access based on modules activated by superadmin |
| `pacient` | Personal portal: consultations, prescriptions, appointments; username = CNP |

---

## API Endpoints (selected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/token/` | Obtain JWT token |
| POST | `/api/token/refresh/` | Refresh token |
| GET/POST | `/api/pacienti/` | List/create patients |
| GET/PUT/PATCH/DELETE | `/api/pacienti/{id}/` | Patient detail/edit/delete |
| GET/POST | `/api/pacienti/{id}/documente/` | Patient documents (R2) |
| DELETE | `/api/documente/{id}/` | Delete document |
| GET/POST | `/api/consultatii/` | List/create consultations |
| GET/POST | `/api/programari/` | List/create appointments |
| GET | `/api/programari/slots_libere/?data=YYYY-MM-DD` | Free slots (public) |
| GET | `/api/configuratie/` | Cabinet configuration (public GET) |
| GET/POST | `/api/retete/` | List/create prescriptions |
| GET | `/api/retete/{id}/print/` | Prescription print |
| GET/POST | `/api/concedii/` | List/create medical leave |
| GET | `/api/concedii/{id}/print/` | Medical leave print |
| GET/POST | `/api/trimiteri/` | List/create referrals |
| GET | `/api/trimiteri/{id}/print/` | Referral print |
| GET | `/api/export-xml/?luna=&an=` | XML Anexa 006 CNAS |
| GET | `/api/export-xml-concedii/?luna=&an=` | XML Anexa 010 CNAS |
| POST | `/api/import-pacienti/` | Excel patient import |
| GET/PATCH | `/api/profil/` | Doctor profile |
| GET/PUT | `/api/module/{id}/` | Active modules per user |
| GET | `/api/zile-libere/?year=YYYY` | Romanian legal holidays (public) |
| POST | `/api/inregistrare/` | Patient self-registration (public) |
| GET | `/api/portal-pacient/` | Patient portal data |
| POST | `/api/reset-parola/` | Password reset by username (public) |
| GET | `/api/loguri/` | Activity logs (superadmin only) |

---

## Print Documents

**Prescription:** `/api/retete/{id}/print/`

**Medical leave:** `/api/concedii/{id}/print/`
Dot matrix calibration: `/api/concedii/{id}/print/?calibrare`

**Referral (simple):** `/api/trimiteri/{id}/print/?tip=simplu`
**Referral (CNAS):** `/api/trimiteri/{id}/print/?tip=cnas`

---

## Development Status

| Phase | Description | Status |
|-------|-------------|--------|
| F1 | Foundation & Auth | ✅ Done |
| F2 | Patients CRUD | ✅ Done |
| F3 | Consultations & Appointments | ✅ Done |
| F4 | Prescriptions, Referrals, Medical Leave | ✅ Done |
| F5 | Dashboard, Reports, Roles, Modules | ✅ Done |
| F6 | Public site, Superadmin, Deployment | ✅ Done |
| F7 | Patient portal, PWA mobile, CNAS export | ✅ Done |
| F8 | CSS Modules, responsive, activity logs | ✅ Done |

---

## Backlog (post-demo)

- **T38** — CNAS referral form coordinate calibration (requires form scan)
- **T71** — Electronic prescription PES (requires CNAS contract)
- **T72** — Health card integration (requires eCard.SDK + physical reader)
- **T89** — Automated testing: pytest backend + Vitest/Playwright frontend (recommended: GitHub Actions)

---

## License

Private project — all rights reserved.
