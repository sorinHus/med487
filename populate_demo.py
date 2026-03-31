"""
T69 — Script populate DB cu date demo fictive pentru MED487
Rulare: python manage.py shell < populate_demo.py
Locatie fisier: D:\MED487\cabinet-medical\populate_demo.py
"""

import os
import django
from django.utils import timezone
from datetime import date, datetime, timedelta
import random

# ── Pacienti fictivi (CNP-uri valide ca format, nu reale) ──────────────────
PACIENTI = [
    # (cnp, nume, prenume, data_nastere, sex, telefon, email, judet, localitate, grup_sangvin)
    ('1850312123456', 'Ionescu',   'Gheorghe',  date(1985, 3, 12), 'M', '0722111001', 'gheorghe.ionescu@email.ro',  'Cluj',    'Cluj-Napoca', 'A+'),
    ('2901128234567', 'Moldovan',  'Maria',     date(1990, 11, 28),'F', '0733222002', 'maria.moldovan@email.ro',    'Cluj',    'Cluj-Napoca', 'O+'),
    ('1750605345678', 'Pop',       'Ioan',      date(1975, 6, 5),  'M', '0744333003', 'ioan.pop@email.ro',          'Cluj',    'Floresti',    'B+'),
    ('2680214456789', 'Muresan',   'Ana',       date(1968, 2, 14), 'F', '0755444004', 'ana.muresan@email.ro',       'Cluj',    'Cluj-Napoca', 'AB+'),
    ('1920820567890', 'Stan',      'Mihai',     date(1992, 8, 20), 'M', '0766555005', 'mihai.stan@email.ro',        'Cluj',    'Dej',         'A-'),
    ('2550330678901', 'Vlad',      'Elena',     date(1955, 3, 30), 'F', '0777666006', 'elena.vlad@email.ro',        'Cluj',    'Cluj-Napoca', 'O-'),
    ('1881010789012', 'Dumitru',   'Constantin',date(1988, 10, 10),'M', '0788777007', 'constantin.d@email.ro',      'Cluj',    'Turda',       'B-'),
    ('2720415890123', 'Cosma',     'Ioana',     date(1972, 4, 15), 'F', '0799888008', 'ioana.cosma@email.ro',       'Cluj',    'Cluj-Napoca', 'A+'),
    ('1950722901234', 'Rus',       'Vasile',    date(1995, 7, 22), 'M', '0711999009', 'vasile.rus@email.ro',        'Cluj',    'Gherla',      'O+'),
    ('2800905012345', 'Chis',      'Dorina',    date(1980, 9, 5),  'F', '0722000010', 'dorina.chis@email.ro',       'Cluj',    'Cluj-Napoca', 'AB-'),
    ('1650118123450', 'Bota',      'Nicolae',   date(1965, 1, 18), 'M', '0733111011', 'nicolae.bota@email.ro',      'Cluj',    'Cluj-Napoca', 'A+'),
    ('2781225234560', 'Sabau',     'Cristina',  date(1978, 12, 25),'F', '0744222012', 'cristina.sabau@email.ro',    'Cluj',    'Campia Turzii','O+'),
    ('1820508345670', 'Florea',    'Dragos',    date(1982, 5, 8),  'M', '0755333013', 'dragos.florea@email.ro',     'Cluj',    'Cluj-Napoca', 'B+'),
    ('2600304456780', 'Nistor',    'Livia',     date(1960, 3, 4),  'F', '0766444014', 'livia.nistor@email.ro',      'Cluj',    'Cluj-Napoca', 'A-'),
    ('1700912567890', 'Moga',      'Sorin',     date(1970, 9, 12), 'M', '0777555015', 'sorin.moga@email.ro',        'Cluj',    'Huedin',      'O+'),
]

DIAGNOSTICE_DEMO = [
    'J06.9',  # Infectie acuta a cailor respiratorii superioare
    'I10',    # Hipertensiune esentiala
    'E11.9',  # Diabet zaharat tip 2
    'M54.5',  # Lombalgie joasa
    'J18.9',  # Pneumonie
    'K29.7',  # Gastrita
    'F32.1',  # Episod depresiv moderat
    'I25.1',  # Cardiopatie ischemica aterosclerotica
    'N39.0',  # Infectie urinara
    'J45.9',  # Astm bronsic
]

MEDICAMENTE = [
    ('Amoxicilina', '500mg caps', '1 caps x 3/zi', 7, 1),
    ('Ibuprofen', '400mg compr', '1 compr x 3/zi dupa masa', 5, 1),
    ('Metformin', '1000mg compr', '1 compr x 2/zi', 30, 1),
    ('Lisinopril', '10mg compr', '1 compr/zi dimineata', 30, 1),
    ('Omeprazol', '20mg caps', '1 caps/zi pe stomacul gol', 14, 1),
    ('Paracetamol', '500mg compr', '1-2 compr x 3/zi', 3, 1),
    ('Augmentin', '875mg/125mg compr', '1 compr x 2/zi', 7, 1),
    ('Enalapril', '5mg compr', '1 compr/zi', 30, 1),
    ('Claritromicina', '500mg compr', '1 compr x 2/zi', 7, 1),
    ('Vitamina D3', '2000UI picaturi', '5 picaturi/zi', 30, 1),
]

SIMPTOME = [
    'Pacient prezinta dureri de cap, febra 38.5C, rinoree, tuse seaca de 3 zile.',
    'Acuza dureri lombare cu iradiere in membrul inferior drept. Debut dupa efort fizic.',
    'Prezinta tuse productiva, expectoratie mucoasa, febra 37.8C. Stare generala influentata.',
    'Dureri epigastrice postprandiale, greata, varsaturi ocazionale. Simptome de 2 saptamani.',
    'Tensiune arteriala 160/95 mmHg la domiciliu in ultimele zile. Cefalee occipitala.',
    'Control periodic. Pacient cu DZ tip 2 cunoscut. Glicemie a jeun 142 mg/dl.',
    'Simptome urinare: disurie, polachiurie, urina tulbure. Debut acum 2 zile.',
    'Dispnee de efort, junghi toracic stang. Pacient fumator 20 pack-years.',
    'Anxietate, insomnie, iritabilitate crescuta in ultimele 3 saptamani. Stres profesional.',
    'Control de rutina. Fara acuze subiective. Solicita reinnoire reteta medicamente cronice.',
]

TRATAMENTE = [
    'Antibioterapie, antiinflamatoare, repaus la domiciliu.',
    'Antiinflamatoare AINS, miorelaxante, fizioterapie recomandata.',
    'Antibioterapie 7 zile, mucolitice, hidratare corespunzatoare.',
    'Inhibitori de pompa de protoni, regim alimentar, evitare AINS.',
    'Ajustare schema antihipertensiva, monitorizare TA zilnic, regim hiposodat.',
    'Continuare Metformin, dieta hipoglucidica, activitate fizica moderata.',
    'Antibioterapie, antialgice, hidratare abundenta.',
    'Bronhodilatatoare, corticosteroizi inhalatori, stop fumat recomandat.',
    'Anxiolitice, psihoterapie recomandata, igiena somnului.',
    'Reinnoire reteta medicamente cronice. Continuare schema actuala.',
]


def run():
    from pacienti.models import (
        CustomUser, Pacient, Diagnostic, Consultatie,
        DiagnosticConsultatie, Programare, Reteta, LinieReteta,
        ConcediuMedical, Trimitere
    )

    # Gaseste medicul ion.popescu
    try:
        medic = CustomUser.objects.get(username='ion.popescu')
    except CustomUser.DoesNotExist:
        print('EROARE: Userul ion.popescu nu exista. Creeaza-l mai intai din admin.')
        return

    print(f'Medic gasit: {medic.get_full_name() or medic.username}')

    # Sterge date demo existente (optional — comenteaza daca nu vrei stergere)
    print('Sterg date demo existente...')
    Trimitere.objects.filter(medic=medic).delete()
    ConcediuMedical.objects.filter(medic=medic).delete()
    LinieReteta.objects.filter(reteta__medic=medic).delete()
    Reteta.objects.filter(medic=medic).delete()
    DiagnosticConsultatie.objects.filter(consultatie__medic=medic).delete()
    Consultatie.objects.filter(medic=medic).delete()
    Programare.objects.filter(medic=medic).delete()
    Pacient.objects.filter(medic=medic).delete()
    print('Date vechi sterse.')

    # Creeaza pacienti
    pacienti_creati = []
    for (cnp, nume, prenume, dn, sex, tel, email, judet, loc, grup) in PACIENTI:
        p = Pacient.objects.create(
            cnp=cnp, nume=nume, prenume=prenume,
            data_nastere=dn, sex=sex, telefon=tel, email=email,
            judet=judet, localitate=loc, grup_sangvin=grup,
            medic=medic, status='activ'
        )
        pacienti_creati.append(p)
        print(f'  Pacient creat: {p}')

    print(f'\nCreati {len(pacienti_creati)} pacienti.')

    # Incarca diagnostice ICD-10 din DB
    diagnostice_db = list(Diagnostic.objects.filter(cod_icd10__in=DIAGNOSTICE_DEMO))
    if not diagnostice_db:
        print('ATENTIE: Nu s-au gasit diagnostice ICD-10 in DB. Asigura-te ca loaddata a rulat.')
        diagnostice_db = []

    # Creeaza consultatii — 3-6 per pacient, in ultimele 12 luni
    consultatii_create = []
    today = date.today()

    for pacient in pacienti_creati:
        nr_consultatii = random.randint(3, 6)
        zile_disponibile = sorted(
            random.sample(range(1, 365), nr_consultatii), reverse=True
        )

        for zile in zile_disponibile:
            data_c = today - timedelta(days=zile)
            ora = random.choice([8, 9, 10, 11, 12, 13, 14, 15, 16])
            minut = random.choice([0, 15, 30, 45])
            data_ora = timezone.make_aware(
                datetime(data_c.year, data_c.month, data_c.day, ora, minut)
            )

            idx = random.randint(0, len(SIMPTOME) - 1)
            c = Consultatie.objects.create(
                pacient=pacient,
                medic=medic,
                data_ora=data_ora,
                simptome=SIMPTOME[idx],
                examen_clinic='Stare generala buna. TA 120/80 mmHg. AV 72/min. Pulmonar - murmur vezicular prezent bilateral.',
                tratament=TRATAMENTE[idx],
                observatii='Pacient cooperant. Urmeaza tratamentul prescris.'
            )

            # Adauga 1-2 diagnostice
            if diagnostice_db:
                diag_sel = random.sample(diagnostice_db, min(2, len(diagnostice_db)))
                for i, diag in enumerate(diag_sel):
                    tip = 'principal' if i == 0 else 'secundar'
                    try:
                        DiagnosticConsultatie.objects.create(
                            consultatie=c, diagnostic=diag, tip=tip
                        )
                    except Exception:
                        pass

            consultatii_create.append(c)

    print(f'Create {len(consultatii_create)} consultatii.')

    # Creeaza retete — 1 reteta la ~jumatate din consultatii
    retete_create = 0
    for c in consultatii_create:
        if random.random() < 0.5:
            diag_c = DiagnosticConsultatie.objects.filter(consultatie=c).first()
            diag_str = diag_c.diagnostic.denumire[:100] if diag_c else ''

            r = Reteta.objects.create(
                pacient=c.pacient,
                medic=medic,
                consultatie=c,
                valabilitate_zile=30,
                gratuit='nu',
                diagnostic=diag_str,
            )

            # 1-2 medicamente pe reteta
            nr_med = random.randint(1, 2)
            med_sel = random.sample(MEDICAMENTE, nr_med)
            for i, (nume_med, conc, doza, durata, cant) in enumerate(med_sel):
                LinieReteta.objects.create(
                    reteta=r,
                    nume_medicament=nume_med,
                    concentratie=conc,
                    doza_frecventa=doza,
                    durata_zile=durata,
                    cantitate=cant,
                    ordine=i + 1
                )
            retete_create += 1

    print(f'Create {retete_create} retete.')

    # Creeaza programari viitoare — 2-4 per pacient urmatoarele 30 zile
    programari_create = 0
    for pacient in pacienti_creati:
        nr_prog = random.randint(1, 2)
        for _ in range(nr_prog):
            zile_viitor = random.randint(1, 30)
            data_p = today + timedelta(days=zile_viitor)
            # Evita weekenduri
            while data_p.weekday() >= 5:
                data_p += timedelta(days=1)
            ora = random.choice([8, 9, 10, 11, 12, 13, 14, 15, 16])
            data_ora = timezone.make_aware(
                datetime(data_p.year, data_p.month, data_p.day, ora, 0)
            )
            Programare.objects.create(
                pacient=pacient,
                medic=medic,
                data_ora=data_ora,
                durata_min=20,
                motiv=random.choice([
                    'Control periodic', 'Reinnoire reteta', 'Rezultate analize',
                    'Consultatie', 'Vaccinare'
                ]),
                status='programat'
            )
            programari_create += 1

    print(f'Create {programari_create} programari viitoare.')

    # Creeaza 3 trimiteri
    trimiteri_create = 0
    specialisti = ['cardiologie', 'neurologie', 'oftalmologie', 'ortopedie', 'dermatologie']
    for pacient in random.sample(pacienti_creati, 3):
        c = Consultatie.objects.filter(pacient=pacient).first()
        Trimitere.objects.create(
            pacient=pacient,
            medic=medic,
            consultatie=c,
            valabilitate_zile=30,
            specialist=random.choice(specialisti),
            diagnostic='Conform fisa clinica',
            prioritate='normal',
        )
        trimiteri_create += 1

    print(f'Create {trimiteri_create} trimiteri.')

    # Creeaza 2 concedii medicale
    for pacient in random.sample(pacienti_creati, 2):
        c = Consultatie.objects.filter(pacient=pacient).first()
        data_ac = today - timedelta(days=random.randint(10, 60))
        ConcediuMedical.objects.create(
            pacient=pacient,
            medic=medic,
            consultatie=c,
            serie_numar=f'CJ{random.randint(100000, 999999)}',
            tip='initial',
            luna=data_ac.month,
            an=data_ac.year,
            cod_indemnizatie='01',
            data_acordarii=data_ac,
            nr_zile=random.randint(3, 7),
            de_la=data_ac,
            pana_la=data_ac + timedelta(days=random.randint(3, 7)),
            cod_diagnostic='J06.9',
            acut_subacut_cronic='acut',
            ambulator_internat='ambulator',
        )

    print('Create 2 concedii medicale.')
    print('\n✅ Date demo populate cu succes!')
    print(f'   - {len(pacienti_creati)} pacienti')
    print(f'   - {len(consultatii_create)} consultatii')
    print(f'   - {retete_create} retete')
    print(f'   - {programari_create} programari viitoare')
    print(f'   - {trimiteri_create} trimiteri')
    print('   - 2 concedii medicale')


run()
