import os, sys, django, random
from datetime import date, timedelta, time, datetime

sys.path.insert(0, '/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from pacienti.models import (
    Pacient, CustomUser, Programare, Consultatie,
    DiagnosticConsultatie, Diagnostic
)
import zoneinfo

TZ       = zoneinfo.ZoneInfo('Europe/Bucharest')
MEDIC_ID = 1
START    = date(2026, 4, 15)
END      = date(2026, 5, 15)

MOTIVE = [
    'Control periodic', 'Reînnoire rețetă', 'Dureri de cap',
    'Tuse persistentă', 'Dureri abdominale', 'Răceală/gripă',
    'Tensiune arterială', 'Dureri de spate', 'Oboseală cronică',
    'Consultație preventivă', 'Rezultate analize', 'Dureri articulare',
    'Probleme digestive', 'Vertij', 'Palpitații',
]

DIAGNOSTICE_CODURI = [
    'J00', 'J06.9', 'J11.1', 'K29.7', 'M54.5',
    'I10', 'R51', 'R05', 'K21.0', 'M79.3',
    'J20.9', 'R42', 'I49.9', 'K59.0', 'R53',
]

OBS_LIST = [
    'Pacient cooperant. Se recomandă repaus.',
    'Stare generală bună. Continuă tratamentul.',
    'Simptome ameliorate față de consultația anterioară.',
    'Se recomandă analize suplimentare.',
    'Pacient cu evoluție favorabilă.',
    'Tratament modificat conform rezultatelor.',
    'Se recomandă consultație de specialitate.',
    'Fără modificări semnificative.',
]

try:
    medic = CustomUser.objects.get(id=MEDIC_ID)
except CustomUser.DoesNotExist:
    print(f"EROARE: Nu exista user cu id={MEDIC_ID}")
    sys.exit(1)

# Fetch pacienti — toti din DB daca medicul are mai putin de 3
pacienti = list(Pacient.objects.filter(medic=medic))
if len(pacienti) < 3:
    pacienti = list(Pacient.objects.all())
if not pacienti:
    print("EROARE: Nu exista pacienti in baza de date.")
    sys.exit(1)

print(f"Medic: {medic.first_name} {medic.last_name} (id={medic.id})")
print(f"Pacienti disponibili: {len(pacienti)}")

# Sterge programarile existente in perioada pentru a evita duplicate
print("Sterg programari existente in perioada 15 apr - 15 mai...")
Programare.objects.filter(
    medic=medic,
    data_ora__date__gte=START,
    data_ora__date__lte=END
).delete()
print("Sterse.")

# Fetch diagnostice
diagnostice = []
for cod in DIAGNOSTICE_CODURI:
    d = Diagnostic.objects.filter(cod_icd10=cod).first()
    if not d:
        d = Diagnostic.objects.filter(cod_icd10__startswith=cod[:3]).first()
    if d:
        diagnostice.append(d)
print(f"Diagnostice disponibile: {len(diagnostice)}")

def get_sloturi():
    slots = []
    for h in range(8, 12):
        for m in (0, 20, 40):
            slots.append(time(h, m))
    for h in range(13, 17):
        for m in (0, 20, 40):
            slots.append(time(h, m))
    return slots

SLOTURI = get_sloturi()

azi         = date.today()
prog_create = 0
cons_create = 0

d = START
while d <= END:
    if d.weekday() >= 5:
        d += timedelta(days=1)
        continue

    nr = random.randint(7, 11)
    sloturi_azi = sorted(random.sample(SLOTURI, min(nr, len(SLOTURI))))

    for slot in sloturi_azi:
        dt      = datetime.combine(d, slot, tzinfo=TZ)
        pacient = random.choice(pacienti)

        if Programare.objects.filter(medic=medic, data_ora=dt).exists():
            continue

        if d < azi:
            status = 'finalizat' if random.random() < 0.80 else 'anulat'
        elif d == azi:
            status = random.choice(['programat', 'confirmat', 'finalizat'])
        else:
            status = random.choices(['programat', 'confirmat'], weights=[60, 40])[0]

        prog = Programare.objects.create(
            medic=medic,
            pacient=pacient,
            data_ora=dt,
            durata_min=20,
            motiv=random.choice(MOTIVE),
            status=status,
            nume_pacient=f"{pacient.nume} {pacient.prenume}",
            telefon_pacient=pacient.telefon or '0700000000',
        )
        prog_create += 1

        if status == 'finalizat' and d < azi and random.random() < 0.50 and diagnostice:
            diag = random.choice(diagnostice)
            cons = Consultatie.objects.create(
                pacient=pacient,
                medic=medic,
                data=d,
                observatii=random.choice(OBS_LIST),
                programare=prog,
            )
            DiagnosticConsultatie.objects.create(
                consultatie=cons,
                diagnostic=diag,
                tip='principal',
            )
            cons_create += 1

    d += timedelta(days=1)

print(f"\nREZULTAT:")
print(f"  Programari create: {prog_create}")
print(f"  Consultatii create: {cons_create}")
print("DONE.")