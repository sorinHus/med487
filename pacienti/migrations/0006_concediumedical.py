# pacienti/migrations/0006_concediumedical.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0005_reteta'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ConcediuMedical',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('serie_numar', models.CharField(max_length=20, verbose_name='Seria și numărul')),
                ('tip', models.CharField(choices=[('initial', 'Inițial'), ('continuare', 'În continuare')], default='initial', max_length=15, verbose_name='Tip')),
                ('serie_initial', models.CharField(blank=True, max_length=20, verbose_name='Seria certificatului inițial')),
                ('luna', models.PositiveIntegerField(verbose_name='Luna (nr.)')),
                ('an', models.PositiveIntegerField(verbose_name='Anul')),
                ('cod_indemnizatie', models.CharField(choices=[('01', '01 - Boală obișnuită'), ('02', '02 - Accident de muncă sau boală profesională'), ('03', '03 - Accident în afara muncii'), ('04', '04 - Boală infectocontagioasă din grupa A'), ('05', '05 - Urgență medico-chirurgicală'), ('06', '06 - Maternitate'), ('07', '07 - Îngrijire copil bolnav'), ('08', '08 - Carantină'), ('09', '09 - Reducerea timpului de muncă'), ('10', '10 - Trecere temporară în alt loc de muncă'), ('11', '11 - Boală infectocontagioasă din grupa B'), ('12', '12 - Tuberculoză'), ('13', '13 - SIDA'), ('14', '14 - Cancer'), ('15', '15 - Risc maternal')], max_length=2, verbose_name='Cod indemnizație')),
                ('data_acordarii', models.DateField(verbose_name='Data acordării')),
                ('nr_zile', models.PositiveIntegerField(verbose_name='Număr zile')),
                ('de_la', models.DateField(verbose_name='De la')),
                ('pana_la', models.DateField(verbose_name='Până la')),
                ('cod_diagnostic', models.CharField(blank=True, max_length=10, verbose_name='Cod diagnostic')),
                ('acut_subacut_cronic', models.CharField(blank=True, choices=[('acut', 'Acut'), ('subacut', 'Subacut'), ('cronic', 'Cronic')], max_length=10, verbose_name='Acut/Subacut/Cronic')),
                ('nr_inreg', models.CharField(blank=True, max_length=20, verbose_name='Nr. înreg. (RC/FO)')),
                ('ambulator_internat', models.CharField(blank=True, choices=[('ambulator', 'Ambulator'), ('internat', 'Internat în spital')], max_length=15, verbose_name='Ambulator/Internat')),
                ('nr_conventie', models.CharField(blank=True, max_length=30, verbose_name='Nr. convenție CAS')),
                ('cas', models.CharField(blank=True, max_length=50, verbose_name='CAS')),
                ('creat_la', models.DateTimeField(auto_now_add=True)),
                ('observatii', models.TextField(blank=True)),
                ('consultatie', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='concedii', to='pacienti.consultatie')),
                ('medic', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='concedii', to=settings.AUTH_USER_MODEL)),
                ('pacient', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='concedii', to='pacienti.pacient')),
            ],
            options={'ordering': ['-data_acordarii', '-creat_la'], 'verbose_name': 'Concediu medical', 'verbose_name_plural': 'Concedii medicale'},
        ),
    ]
