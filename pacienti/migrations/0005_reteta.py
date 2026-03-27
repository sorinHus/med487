# pacienti/migrations/0005_reteta.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0004_pacient_adresa_split'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ConfiguratieCabinet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('denumire_unitate', models.CharField(max_length=255, verbose_name='Denumire unitate sanitară')),
                ('localitate', models.CharField(max_length=100, verbose_name='Localitatea')),
                ('judet', models.CharField(max_length=50, verbose_name='Județul')),
                ('strada', models.CharField(blank=True, max_length=150, verbose_name='Strada')),
                ('numar', models.CharField(blank=True, max_length=20, verbose_name='Număr')),
                ('telefon', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True)),
                ('cui', models.CharField(blank=True, max_length=20, verbose_name='CUI')),
                ('cod_parafă', models.CharField(blank=True, max_length=20, verbose_name='Cod parafă medic')),
            ],
            options={'verbose_name': 'Configurație cabinet'},
        ),
        migrations.CreateModel(
            name='Reteta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('numar_reteta', models.CharField(blank=True, max_length=20, unique=True, verbose_name='Număr rețetă')),
                ('data_emiterii', models.DateField(auto_now_add=True, verbose_name='Data emiterii')),
                ('valabilitate_zile', models.PositiveIntegerField(default=30, verbose_name='Valabilitate (zile)')),
                ('gratuit', models.CharField(choices=[('da', 'Gratuit'), ('nu', 'Cu plată')], default='nu', max_length=2, verbose_name='Gratuit')),
                ('diagnostic', models.CharField(blank=True, max_length=255, verbose_name='Diagnostic')),
                ('nr_fisa', models.CharField(blank=True, max_length=50, verbose_name='Nr. fișă / reg. cons.')),
                ('observatii', models.TextField(blank=True, verbose_name='Observații')),
                ('creat_la', models.DateTimeField(auto_now_add=True)),
                ('consultatie', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='retete', to='pacienti.consultatie')),
                ('medic', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='retete', to=settings.AUTH_USER_MODEL)),
                ('pacient', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='retete', to='pacienti.pacient')),
            ],
            options={'ordering': ['-data_emiterii', '-creat_la']},
        ),
        migrations.CreateModel(
            name='LinieReteta',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('nume_medicament', models.CharField(max_length=255, verbose_name='Medicament')),
                ('concentratie', models.CharField(blank=True, max_length=100, verbose_name='Concentrație / formă')),
                ('doza_frecventa', models.CharField(blank=True, max_length=150, verbose_name='Doză și frecvență')),
                ('durata_zile', models.PositiveIntegerField(blank=True, null=True, verbose_name='Durată tratament (zile)')),
                ('cantitate', models.PositiveIntegerField(default=1, verbose_name='Cantitate (cutii)')),
                ('observatii', models.CharField(blank=True, max_length=255, verbose_name='Observații')),
                ('ordine', models.PositiveIntegerField(default=0, verbose_name='Ordine')),
                ('reteta', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='linii', to='pacienti.reteta')),
            ],
            options={'ordering': ['ordine', 'id']},
        ),
    ]
