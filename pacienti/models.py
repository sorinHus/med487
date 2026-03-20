from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROL_CHOICES = [('medic', 'Medic'), ('asistenta', 'Asistenta')]
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='medic')

    def __str__(self):
        return f"{self.get_full_name()} ({self.rol})"


class Pacient(models.Model):
    SEX_CHOICES = [('M', 'Masculin'), ('F', 'Feminin')]
    GRUP_CHOICES = [('A+','A+'),('A-','A-'),('B+','B+'),('B-','B-'),
                    ('AB+','AB+'),('AB-','AB-'),('0+','0+'),('0-','0-')]
    STATUS_CHOICES = [
        ('activ', 'Activ'),
        ('decedat', 'Decedat'),
        ('transferat', 'Transferat la alt medic'),
        ('inactiv', 'Inactiv'),
    ]

    cnp               = models.CharField(max_length=13, unique=True)
    nume              = models.CharField(max_length=100)
    prenume           = models.CharField(max_length=100)
    data_nastere      = models.DateField()
    sex               = models.CharField(max_length=1, choices=SEX_CHOICES)
    telefon           = models.CharField(max_length=20, blank=True)
    email             = models.EmailField(blank=True)
    adresa            = models.TextField(blank=True)
    grup_sangvin      = models.CharField(max_length=3, choices=GRUP_CHOICES, blank=True)
    alergii           = models.TextField(blank=True)
    data_inregistrare = models.DateField(auto_now_add=True)
    status            = models.CharField(max_length=20, choices=STATUS_CHOICES, default='activ')
    medic             = models.ForeignKey(CustomUser, on_delete=models.PROTECT,
                                          related_name='pacienti')

    class Meta:
        ordering = ['nume', 'prenume']

    def __str__(self):
        return f"{self.nume} {self.prenume} ({self.cnp})"


class Diagnostic(models.Model):
    cod_icd10 = models.CharField(max_length=10, unique=True)
    denumire  = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.cod_icd10} — {self.denumire}"


class Consultatie(models.Model):
    pacient       = models.ForeignKey(Pacient, on_delete=models.PROTECT,
                                      related_name='consultatii')
    medic         = models.ForeignKey(CustomUser, on_delete=models.PROTECT,
                                      related_name='consultatii')
    data_ora      = models.DateTimeField()
    simptome      = models.TextField(blank=True)
    examen_clinic = models.TextField(blank=True)
    tratament     = models.TextField(blank=True)
    observatii    = models.TextField(blank=True)
    diagnostice   = models.ManyToManyField(Diagnostic,
                                           through='DiagnosticConsultatie',
                                           blank=True)

    class Meta:
        ordering = ['-data_ora']

    def __str__(self):
        return f"Consultatie {self.pacient} — {self.data_ora:%d.%m.%Y}"


class DiagnosticConsultatie(models.Model):
    TIP_CHOICES = [('principal', 'Principal'), ('secundar', 'Secundar')]
    consultatie = models.ForeignKey(Consultatie, on_delete=models.CASCADE)
    diagnostic  = models.ForeignKey(Diagnostic, on_delete=models.PROTECT)
    tip         = models.CharField(max_length=20, choices=TIP_CHOICES,
                                   default='principal')

    class Meta:
        unique_together = ('consultatie', 'diagnostic')

class Programare(models.Model):
    STATUS_CHOICES = [
        ('programat', 'Programat'),
        ('confirmat', 'Confirmat'),
        ('anulat', 'Anulat'),
        ('finalizat', 'Finalizat'),
    ]

    pacient       = models.ForeignKey(Pacient, on_delete=models.PROTECT,
                                      related_name='programari',
                                      null=True, blank=True)
    medic         = models.ForeignKey(CustomUser, on_delete=models.PROTECT,
                                      related_name='programari')
    data_ora      = models.DateTimeField()
    durata_min    = models.PositiveIntegerField(default=20)
    motiv         = models.CharField(max_length=255, blank=True)
    nume_pacient  = models.CharField(max_length=100, blank=True)
    telefon_pacient = models.CharField(max_length=20, blank=True)
    email_pacient = models.EmailField(blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES,
                                     default='programat')
    creat_la      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['data_ora']

    def __str__(self):
        nume = self.pacient or self.nume_pacient
        return f"{nume} — {self.data_ora:%d.%m.%Y %H:%M}"
       