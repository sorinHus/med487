from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class CustomUser(AbstractUser):
    ROL_CHOICES = [('medic', 'Medic'), ('asistent', 'Asistent'), ('superadmin', 'Superadmin'), ('pacient', 'Pacient')]
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default='medic')
    telefon = models.CharField(max_length=20, blank=True, default='')
    parafa = models.CharField(max_length=20, blank=True, default='')
    cod_medic = models.CharField(max_length=30, blank=True, default='')
    aprobat = models.BooleanField(default=True)

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
    judet             = models.CharField(max_length=50, blank=True, default='', verbose_name='Județ')
    localitate        = models.CharField(max_length=100, blank=True, default='', verbose_name='Localitate')
    strada            = models.CharField(max_length=150, blank=True, default='', verbose_name='Strada')
    numar_strada      = models.CharField(max_length=20, blank=True, default='', verbose_name='Număr')
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
    tip         = models.CharField(max_length=20, choices=TIP_CHOICES, default='principal')

    class Meta:
        unique_together = ('consultatie', 'diagnostic')


class Programare(models.Model):
    STATUS_CHOICES = [
        ('programat', 'Programat'),
        ('confirmat', 'Confirmat'),
        ('anulat', 'Anulat'),
        ('finalizat', 'Finalizat'),
    ]

    pacient         = models.ForeignKey(Pacient, on_delete=models.PROTECT,
                                        related_name='programari',
                                        null=True, blank=True)
    medic           = models.ForeignKey(CustomUser, on_delete=models.PROTECT,
                                        related_name='programari')
    data_ora        = models.DateTimeField()
    durata_min      = models.PositiveIntegerField(default=20)
    motiv           = models.CharField(max_length=255, blank=True)
    nume_pacient    = models.CharField(max_length=100, blank=True)
    telefon_pacient = models.CharField(max_length=20, blank=True)
    email_pacient   = models.EmailField(blank=True)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='programat')
    creat_la        = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['data_ora']

    def __str__(self):
        nume = self.pacient or self.nume_pacient
        return f"{nume} — {self.data_ora:%d.%m.%Y %H:%M}"


class ConfiguratieCabinet(models.Model):
    denumire_unitate    = models.CharField(max_length=255, blank=True, verbose_name='Denumire unitate sanitară')
    localitate          = models.CharField(max_length=100, blank=True, verbose_name='Localitatea')
    judet               = models.CharField(max_length=50, blank=True, verbose_name='Județul')
    strada              = models.CharField(max_length=150, blank=True, verbose_name='Strada')
    numar               = models.CharField(max_length=20, blank=True, verbose_name='Număr')
    telefon             = models.CharField(max_length=20, blank=True)
    email               = models.EmailField(blank=True)
    cui                 = models.CharField(max_length=20, blank=True, verbose_name='CUI')
    cod_parafă          = models.CharField(max_length=20, blank=True, verbose_name='Cod parafă medic')
    # Setări globale
    email_contact       = models.EmailField(blank=True, verbose_name='Email contact support')
    durata_slot         = models.PositiveIntegerField(default=30, verbose_name='Durată slot programare (min)')
    max_programari_zi   = models.PositiveIntegerField(default=20, verbose_name='Max programări per zi')
    mod_mentenanta      = models.BooleanField(default=False, verbose_name='Mod mentenanță')

    orar_saptamanal = models.JSONField(
        default=dict,
        blank=True,
        help_text="Orar per zi: {luni: {activ, intervale: [{start, end}]}}"
    )

    class Meta:
        verbose_name = 'Configurație cabinet'

    def __str__(self):
        return self.denumire_unitate

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Reteta(models.Model):
    GRATUIT_CHOICES = [
        ('da', 'Gratuit'),
        ('nu', 'Cu plată'),
    ]

    pacient           = models.ForeignKey('Pacient', on_delete=models.PROTECT,
                                          related_name='retete')
    medic             = models.ForeignKey('CustomUser', on_delete=models.PROTECT,
                                          related_name='retete')
    consultatie       = models.ForeignKey('Consultatie', on_delete=models.SET_NULL,
                                          null=True, blank=True, related_name='retete')
    numar_reteta      = models.CharField(max_length=20, unique=True, blank=True,
                                         verbose_name='Număr rețetă')
    data_emiterii     = models.DateField(auto_now_add=True, verbose_name='Data emiterii')
    valabilitate_zile = models.PositiveIntegerField(default=30, verbose_name='Valabilitate (zile)')
    gratuit           = models.CharField(max_length=2, choices=GRATUIT_CHOICES,
                                         default='nu', verbose_name='Gratuit')
    diagnostic        = models.CharField(max_length=255, blank=True, verbose_name='Diagnostic')
    nr_fisa           = models.CharField(max_length=50, blank=True, verbose_name='Nr. fișă / reg. cons.')
    observatii        = models.TextField(blank=True, verbose_name='Observații')
    creat_la          = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-data_emiterii', '-creat_la']

    def save(self, *args, **kwargs):
        if not self.numar_reteta:
            super().save(*args, **kwargs)
            from django.utils import timezone
            an = timezone.now().year
            count = Reteta.objects.filter(data_emiterii__year=an).count()
            self.numar_reteta = f'RX{count:05d}/{an}'
            Reteta.objects.filter(pk=self.pk).update(numar_reteta=self.numar_reteta)
        else:
            super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.numar_reteta} — {self.pacient}'


class LinieReteta(models.Model):
    reteta          = models.ForeignKey(Reteta, on_delete=models.CASCADE, related_name='linii')
    nume_medicament = models.CharField(max_length=255, verbose_name='Medicament')
    concentratie    = models.CharField(max_length=100, blank=True, verbose_name='Concentrație / formă')
    doza_frecventa  = models.CharField(max_length=150, blank=True, verbose_name='Doză și frecvență')
    durata_zile     = models.PositiveIntegerField(null=True, blank=True, verbose_name='Durată tratament (zile)')
    cantitate       = models.PositiveIntegerField(default=1, verbose_name='Cantitate (cutii)')
    observatii      = models.CharField(max_length=255, blank=True, verbose_name='Observații')
    ordine          = models.PositiveIntegerField(default=0, verbose_name='Ordine')

    class Meta:
        ordering = ['ordine', 'id']

    def __str__(self):
        return f'{self.nume_medicament} ({self.reteta.numar_reteta})'


class ConcediuMedical(models.Model):
    COD_INDEMNIZATIE_CHOICES = [
        ('01', '01 - Boală obișnuită'),
        ('02', '02 - Accident de muncă sau boală profesională'),
        ('03', '03 - Accident în afara muncii'),
        ('04', '04 - Boală infectocontagioasă din grupa A'),
        ('05', '05 - Urgență medico-chirurgicală'),
        ('06', '06 - Maternitate'),
        ('07', '07 - Îngrijire copil bolnav'),
        ('08', '08 - Carantină'),
        ('09', '09 - Reducerea timpului de muncă'),
        ('10', '10 - Trecere temporară în alt loc de muncă'),
        ('11', '11 - Boală infectocontagioasă din grupa B'),
        ('12', '12 - Tuberculoză'),
        ('13', '13 - SIDA'),
        ('14', '14 - Cancer'),
        ('15', '15 - Risc maternal'),
    ]
    TIP_CHOICES = [
        ('initial', 'Inițial'),
        ('continuare', 'În continuare'),
    ]

    pacient          = models.ForeignKey('Pacient', on_delete=models.PROTECT, related_name='concedii')
    medic            = models.ForeignKey('CustomUser', on_delete=models.PROTECT, related_name='concedii')
    consultatie      = models.ForeignKey('Consultatie', on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='concedii')
    serie_numar      = models.CharField(max_length=20, verbose_name='Seria și numărul')
    tip              = models.CharField(max_length=15, choices=TIP_CHOICES,
                                        default='initial', verbose_name='Tip')
    serie_initial    = models.CharField(max_length=20, blank=True, verbose_name='Seria certificatului inițial')
    luna             = models.PositiveIntegerField(verbose_name='Luna (nr.)')
    an               = models.PositiveIntegerField(verbose_name='Anul')
    cod_indemnizatie = models.CharField(max_length=2, choices=COD_INDEMNIZATIE_CHOICES,
                                        verbose_name='Cod indemnizație')
    data_acordarii   = models.DateField(verbose_name='Data acordării')
    nr_zile          = models.PositiveIntegerField(verbose_name='Număr zile')
    de_la            = models.DateField(verbose_name='De la')
    pana_la          = models.DateField(verbose_name='Până la')
    cod_diagnostic   = models.CharField(max_length=10, blank=True, verbose_name='Cod diagnostic')
    acut_subacut_cronic = models.CharField(
        max_length=10, blank=True,
        choices=[('acut', 'Acut'), ('subacut', 'Subacut'), ('cronic', 'Cronic')],
        verbose_name='Acut/Subacut/Cronic'
    )
    nr_inreg         = models.CharField(max_length=20, blank=True, verbose_name='Nr. înreg. (RC/FO)')
    ambulator_internat = models.CharField(
        max_length=15, blank=True,
        choices=[('ambulator', 'Ambulator'), ('internat', 'Internat în spital')],
        verbose_name='Ambulator/Internat'
    )
    nr_conventie     = models.CharField(max_length=30, blank=True, verbose_name='Nr. convenție CAS')
    cas              = models.CharField(max_length=50, blank=True, verbose_name='CAS')
    creat_la         = models.DateTimeField(auto_now_add=True)
    observatii       = models.TextField(blank=True)

    class Meta:
        ordering = ['-data_acordarii', '-creat_la']
        verbose_name = 'Concediu medical'
        verbose_name_plural = 'Concedii medicale'

    def __str__(self):
        return f'Concediu {self.serie_numar} — {self.pacient} ({self.nr_zile} zile)'


class Trimitere(models.Model):
    SPECIALIST_CHOICES = [
        ('cardiologie', 'Cardiologie'),
        ('neurologie', 'Neurologie'),
        ('oftalmologie', 'Oftalmologie'),
        ('ortopedie', 'Ortopedie'),
        ('dermatologie', 'Dermatologie'),
        ('ginecologie', 'Ginecologie'),
        ('urologie', 'Urologie'),
        ('gastroenterologie', 'Gastroenterologie'),
        ('endocrinologie', 'Endocrinologie'),
        ('psihiatrie', 'Psihiatrie'),
        ('pneumologie', 'Pneumologie'),
        ('reumatologie', 'Reumatologie'),
        ('nefrologie', 'Nefrologie'),
        ('hematologie', 'Hematologie'),
        ('oncologie', 'Oncologie'),
        ('chirurgie', 'Chirurgie'),
        ('ORL', 'ORL'),
        ('stomatologie', 'Stomatologie'),
        ('recuperare', 'Recuperare medicala'),
        ('altele', 'Altele'),
    ]
    PRIORITATE_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
    ]

    pacient               = models.ForeignKey(Pacient, on_delete=models.CASCADE,
                                               related_name='trimiteri')
    medic                 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                                               related_name='trimiteri_emise')
    consultatie           = models.ForeignKey(Consultatie, on_delete=models.SET_NULL,
                                               null=True, blank=True, related_name='trimiteri')
    numar_trimitere       = models.CharField(max_length=20, unique=True, editable=False)
    data_emiterii         = models.DateField(auto_now_add=True)
    valabilitate_zile     = models.IntegerField(default=30)
    specialist            = models.CharField(max_length=50, choices=SPECIALIST_CHOICES)
    specialist_custom     = models.CharField(max_length=100, blank=True)
    unitate_medicala      = models.CharField(max_length=200, blank=True)
    diagnostic            = models.CharField(max_length=500, blank=True)
    cod_diagnostic        = models.CharField(max_length=10, blank=True)
    investigatii_solicitate = models.TextField(blank=True)
    prioritate            = models.CharField(max_length=10, choices=PRIORITATE_CHOICES, default='normal')
    nr_fisa               = models.CharField(max_length=50, blank=True)
    observatii            = models.TextField(blank=True)

    class Meta:
        ordering = ['-data_emiterii', '-id']
        verbose_name = 'Trimitere'
        verbose_name_plural = 'Trimiteri'

    def save(self, *args, **kwargs):
        if not self.numar_trimitere:
            from django.utils import timezone
            an = timezone.now().year
            last = Trimitere.objects.filter(
                numar_trimitere__endswith=f'/{an}'
            ).order_by('-id').first()
            if last:
                nr = int(last.numar_trimitere.split('TR')[1].split('/')[0]) + 1
            else:
                nr = 1
            self.numar_trimitere = f'TR{nr:05d}/{an}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.numar_trimitere} — {self.pacient} → {self.specialist}'
    
class ModuleUtilizator(models.Model):
    MODULE_CHOICES = [
        ('pacienti', 'Pacienți'),
        ('consultatii', 'Consultații'),
        ('programari', 'Programări'),
        ('retete', 'Rețete'),
        ('trimiteri', 'Trimiteri'),
        ('concedii', 'Concedii'),
        ('rapoarte', 'Rapoarte'),
    ]
    user   = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='module')
    active = models.JSONField(default=list)

    def __str__(self):
        return f"Module {self.user.username}"