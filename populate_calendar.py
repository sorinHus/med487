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

TZ    = zoneinfo.ZoneInfo('Europe/Bucharest')
START = date(2026, 3, 15)
END   = date(2026, 4, 15)

MOTIVE = [
    'Control periodic', 'Reînnoire rețetă', 'Dureri de cap',
    'Tuse persistentă', 'Dureri abdominale', 'Răceală/gripă',
    'Tensiune arterială', 'Dureri de spate', 'Oboseală cronică',
    'Consultație preventivă', 'Rezultate analize', 'Dureri articulare',
    'Probleme digestive', 'Vertij', 'Palpitații',
]

SIMPTOME = [
    'Dureri de cap, febră 38.5°C, rinoree, tuse seacă.',
    'Dureri lombare cu iradiere în membrul inferior drept.',
    'Tuse productivă, expectorație mucoasă, febră 37.8°C.',
    'Dureri epigastrice postprandiale, greață, vărsături ocazionale.',
    'Tensiune arterială 160/95 mmHg la domiciliu. Cefalee occipitală.',
    'Control periodic. Pacient cu DZ tip 2 cunoscut.',
    'Disurie, polakiurie, urină tulbure. Debut acum 2 zile.',
    'Dispnee de efort, junghi toracic stâng.',
    'Anxietate, insomnie, iritabilitate crescută.',
    'Control de rutină. Fără acuze subiective.',
]

TRATAMENTE = [
    'Antibioterapie, antiinflamatoare, repaus la domiciliu.',
    'Antiinflamatoare AINS, miorelaxante, fizioterapie recomandată.',
    'Antibioterapie 7 zile, mucolitice, hidratare corespunzătoare.',
    'Inhibitori de pompă de protoni, regim alimentar.',
    'Ajustare schemă antihipertensivă, monitorizare TA zilnic.',
    'Continuare Metformin, dietă hipoglucidică.',
    'Antibioterapie, antialgice, hidratare abundentă.',
    'Bronhodilatatoare, corticosteroizi inhalatori.',
    'Anxiolitice, psihoterapie recomandată.',
    'Reînnoire rețetă medicamente cronice. Continuare schemă actuală.',
]

try:
    medic = CustomUser.objects.get(username='ion.popescu')
except CustomUser.DoesNotExist:
    print("EROARE: Nu exista user ion.popescu")
    sys.exit(1)

pacienti = list(Pacient.objects.filter(medic=medic))
if len(pacienti) < 3:
    pacienti = list(Pacient.objects.all())
if not pacienti:
    print("EROARE: Nu exista pacienti in baza de date.")
    sys.exit(1)

print(f"Medic: {medic.first_name} {medic.last_name} (id={medic.id})")
print(f"Pacienti disponibili: {len(pacienti)}")

diagnostice = list(Diagnostic.objects.all()[:20])
print(f"Diagnostice disponibile: {len(diagnostice)}")

print("Sterg date existente in perioada...")
Consultatie.objects.filter(
    medic=medic,
    data_ora__date__gte=START,
    data_ora__date__lte=END
).delete()
Programare.objects.filter(
    medic=medic,
    data_ora__date__gte=START,
    data_ora__date__lte=END
).delete()
print("Sterse.")

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

        if d <= azi:
            status = 'finalizat' if random.random() < 0.80 else 'anulat'
        else:
            status = random.choices(['programat', 'confirmat'], weights=[60, 40])[0]

        idx = random.randint(0, len(SIMPTOME) - 1)

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

        if status == 'finalizat' and d <= azi and random.random() < 0.50:
            cons = Consultatie.objects.create(
                pacient=pacient,
                medic=medic,
                data_ora=dt,
                simptome=SIMPTOME[idx],
                examen_clinic='Stare generală bună. TA 120/80 mmHg. AV 72/min.',
                tratament=TRATAMENTE[idx],
                observatii='Pacient cooperant. Urmează tratamentul prescris.',
            )
            if diagnostice:
                DiagnosticConsultatie.objects.create(
                    consultatie=cons,
                    diagnostic=random.choice(diagnostice),
                    tip='principal',
                )
            cons_create += 1

    d += timedelta(days=1)

print(f"\nREZULTAT:")
print(f"  Programari create: {prog_create}")
print(f"  Consultatii create: {cons_create}")
print("DONE.")