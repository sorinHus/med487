# MED487 — Aplicație Cabinet Medicină de Familie

Aplicație web pentru managementul unui cabinet de medicină de familie. Dezvoltată cu Django 6 + DRF pe backend și React 19 + Vite pe frontend.

---

## Stack tehnologic

**Backend**
- Python / Django 6.0.3
- Django REST Framework
- PostgreSQL
- JWT Authentication (simplejwt)
- django-filter, django-cors-headers

**Frontend**
- React 19 + Vite 8
- Axios 1.13
- Dark theme cu inline styles

---

## Funcționalități implementate

- **Autentificare** — JWT cu refresh automat, roluri medic/asistentă
- **Pacienți** — CRUD complet, validare CNP românesc, adresă cu dropdown județ/localitate (42 județe, 13.812 localități)
- **Consultații** — istoric per pacient, integrare ICD-10, diagnostice principal/secundar
- **Programări** — calendar săptămânal, programare publică online, notificări email
- **Rețete medicale** — model cu linii medicamente, numerotare automată RX00001/2026, template print/PDF
- **Concedii medicale** — model complet conform formular CNAS, template print dot matrix cu mod calibrare
- **Configurație cabinet** — singleton cu date unitate sanitară, CUI, cod parafă

---

## Structura proiectului

```
cabinet-medical/
├── backend/                  # Django project settings
│   ├── settings.py
│   └── urls.py
├── pacienti/                 # Aplicatia principala
│   ├── models.py             # CustomUser, Pacient, Consultatie, Reteta, etc.
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── migrations/
│   └── templates/
│       └── pacienti/
│           ├── reteta_print.html
│           └── concediu_print.html
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── AdresaFields.jsx
│   │   ├── utils/
│   │   │   ├── cnp.js
│   │   │   └── romania_geo.js
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── auth.js
│   └── public/
│       └── programare.html   # Programare publica (fara autentificare)
└── .env                      # Variabile de mediu (nu e in repo)
```

---

## Instalare și rulare locală

### Cerințe
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
# Clonează repo-ul
git clone https://github.com/sorinHus/med487.git
cd med487/cabinet-medical

# Creează și activează venv
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Instalează dependențele
pip install -r requirements.txt

# Configurează .env (vezi .env.example)
cp .env.example .env
# Editează .env cu datele tale PostgreSQL și email

# Migrări
python manage.py migrate

# Creează superuser
python manage.py createsuperuser

# Pornește serverul
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicația e disponibilă la `http://localhost:5173`.

---

## Variabile de mediu (.env)

```env
SECRET_KEY=cheia-ta-secreta
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/med487
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=emailul-tau@gmail.com
EMAIL_HOST_PASSWORD=app-password-gmail
DEFAULT_FROM_EMAIL=emailul-tau@gmail.com
EMAIL_CABINET=emailul-cabinetului@gmail.com
```

---

## API Endpoints principale

| Method | Endpoint | Descriere |
|--------|----------|-----------|
| POST | `/api/token/` | Obținere token JWT |
| POST | `/api/token/refresh/` | Refresh token |
| GET/POST | `/api/pacienti/` | Lista/creare pacienți |
| GET/PUT/PATCH | `/api/pacienti/{id}/` | Detalii/editare pacient |
| GET | `/api/pacienti/{id}/consultatii/` | Consultații per pacient |
| GET/POST | `/api/consultatii/` | Lista/creare consultații |
| GET/POST | `/api/programari/` | Lista/creare programări |
| GET | `/api/programari/slots_libere/?data=YYYY-MM-DD` | Sloturi libere (public) |
| GET/PUT | `/api/configuratie/1/` | Configurație cabinet |
| GET/POST | `/api/retete/` | Lista/creare rețete |
| GET | `/api/retete/{id}/print/` | Preview print rețetă |
| GET/POST | `/api/concedii/` | Lista/creare concedii medicale |
| GET | `/api/concedii/{id}/print/` | Preview print concediu |

---

## Print documente medicale

Rețetele și concediile medicale se printează direct din browser (Print → Save as PDF).

**Rețetă:** `http://127.0.0.1:8000/api/retete/{id}/print/`

**Concediu medical:** `http://127.0.0.1:8000/api/concedii/{id}/print/`

Concediul suportă mod calibrare pentru imprimante dot matrix:
`http://127.0.0.1:8000/api/concedii/{id}/print/?calibrare`

---

## Status dezvoltare

| Faza | Descriere | Status |
|------|-----------|--------|
| F1 | Fundație & Auth | ✅ Complet |
| F2 | Pacienți CRUD | ✅ Complet |
| F3 | Consultații & Programări | ✅ Complet |
| F4 | Rețete & Trimiteri | 🔄 În progres |
| F5 | Rapoarte & Dashboard | ⏳ Backlog |
| F6 | Deploy & Hardening | ⏳ Backlog |

---

## Licență

Proiect privat — toate drepturile rezervate.
