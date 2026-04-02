# MED487 — Family Medicine Practice Management App

A web application for managing a family medicine practice. Built with Django 6 + DRF on the backend and React 19 + Vite on the frontend.

---

## Tech Stack

**Backend**
- Python / Django 6.0.3
- Django REST Framework
- PostgreSQL
- JWT Authentication (simplejwt — access 8h / refresh 7 days)
- django-filter, django-cors-headers, anymail (Resend)

**Frontend**
- React 19 + Vite 8
- Axios 1.13
- React Router DOM
- Recharts
- Dark theme with inline styles

---

## Implemented Features

- **Authentication** — JWT with automatic refresh, role-based access (superadmin / medic / asistent / pacient), auto logout after 2h inactivity
- **Patients** — Full CRUD, Romanian CNP validation, address with county/locality dropdowns (42 counties, 13,812 localities)
- **Consultations** — Per-patient history, ICD-10 integration (1,009 codes), primary/secondary diagnoses
- **Appointments** — Weekly calendar, public online booking, email notifications, legal holiday blocking, configurable weekly schedule
- **Medical Prescriptions** — Line-item model, auto-numbering RX00001/2026, print/PDF template
- **Medical Leave** — Full CNAS form model, dot matrix print template with calibration mode
- **Referrals** — Specialist referral model, print templates (simple + CNAS)
- **Doctor Profile** — Personal data + password change
- **Module System** — Per-user active module management, sidebar filtered by active modules
- **Superadmin Panel** — User management, module activation, global settings (cabinet info, slot duration, maintenance mode, weekly schedule)
- **Public Site** — Presentation site (light mode) with hero, services, schedule, and contact sections; schedule loaded from DB
- **Public Booking** — Standalone HTML page, blocks weekends + legal holidays, 30-day limit, slots from API

---

## Project Structure

```
cabinet-medical/
├── backend/                  # Django project settings
│   ├── settings.py
│   └── urls.py
├── pacienti/                 # Main application
│   ├── models.py             # CustomUser, Pacient, Consultatie, Reteta, ConcediuMedical, Trimitere, ConfiguratieCabinet, ModuleUtilizator
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── migrations/           # 0001–0013
│   ├── fixtures/
│   │   └── diagnostice_fixture.json   # 1,009 ICD-10 codes
│   └── templates/
│       └── pacienti/
│           ├── reteta_print.html
│           ├── concediu_print.html
│           ├── trimitere_simpla_print.html
│           └── trimitere_cnas_print.html
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdresaFields.jsx
│   │   │   ├── SitePrezentare.jsx
│   │   │   └── SuperadminPanel.jsx
│   │   ├── utils/
│   │   │   ├── cnp.js
│   │   │   └── romania_geo.js
│   │   ├── App.jsx           # React Router: / → SitePrezentare, /app → AppInterna
│   │   ├── api.js
│   │   └── auth.js
│   └── public/
│       └── programare.html   # Public booking (no authentication)
└── .env                      # Environment variables (not in repo)
```

---

## Local Setup

### Requirements
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
git clone https://github.com/sorinHus/med487.git
cd med487/cabinet-medical

python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

cp .env.example .env
# Edit .env with your PostgreSQL and email credentials

python manage.py migrate
python manage.py loaddata pacienti/fixtures/diagnostice_fixture.json
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`.

---

## Environment Variables (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_NAME=med487
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_HOST=localhost
DATABASE_PORT=5432
RESEND_API_KEY=your-resend-key
DEFAULT_FROM_EMAIL=onboarding@resend.dev
EMAIL_CABINET=your-email@gmail.com
```

---

## User Roles

| Role | Access |
|------|--------|
| `superadmin` | Platform administration: users, modules, global settings |
| `medic` | Full application access |
| `asistent` | Limited access based on modules activated by superadmin |
| `pacient` | Personal portal: consultations, prescriptions, appointments |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/token/` | Obtain JWT token |
| POST | `/api/token/refresh/` | Refresh token |
| GET/POST | `/api/pacienti/` | List/create patients |
| GET/PUT/PATCH/DELETE | `/api/pacienti/{id}/` | Patient detail/edit/delete |
| GET | `/api/pacienti/{id}/consultatii/` | Consultations per patient |
| GET/POST | `/api/consultatii/` | List/create consultations |
| GET/POST | `/api/programari/` | List/create appointments |
| GET | `/api/programari/slots_libere/?data=YYYY-MM-DD` | Free slots (public) |
| GET | `/api/configuratie/` | Cabinet configuration (public GET) |
| PUT/PATCH | `/api/configuratie/1/` | Update configuration |
| GET/POST | `/api/retete/` | List/create prescriptions |
| GET | `/api/retete/{id}/print/` | Prescription print preview |
| GET/POST | `/api/concedii/` | List/create medical leave |
| GET | `/api/concedii/{id}/print/` | Medical leave print preview |
| GET/POST | `/api/trimiteri/` | List/create referrals |
| GET | `/api/trimiteri/{id}/print/` | Referral print preview |
| GET/PATCH | `/api/profil/` | Doctor profile |
| POST | `/api/profil/schimbare-parola/` | Change password |
| GET/PUT | `/api/module/{id}/` | Active modules per user |
| GET | `/api/zile-libere/?year=YYYY` | Romanian legal holidays (public) |

---

## Print Documents

Prescriptions, medical leave, and referrals print directly from the browser (Print → Save as PDF).

**Prescription:** `/api/retete/{id}/print/`

**Medical leave:** `/api/concedii/{id}/print/`
Dot matrix calibration mode: `/api/concedii/{id}/print/?calibrare`

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
| F9 | Configurable schedule, Theme system, Patient portal | 🔄 In progress |

---

## Backlog (post-demo)

- **T64** — Dark/light theme system (CSS variables, all components use inline styles)
- **T67** — Patient portal with public registration and doctor approval flow
- **T68** — Public booking with patient account association
- **T56** — GDPR — data policy, access logging
- **T57** — End-to-end testing
- **T58** — Mobile responsive
- **T63b** — Configurable alternate schedule (done)
- **T70** — SIUI integration (CNAS reporting)
- **T71** — Electronic prescription (PES)
- **T72** — Health card integration
- **T73** — Rate limiting on public endpoints
- **T77** — Document upload per patient

---

## License

Private project — all rights reserved.
