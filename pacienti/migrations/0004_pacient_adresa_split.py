# pacienti/migrations/0004_pacient_adresa_split.py
# Inlocuieste campul `adresa` cu: judet, localitate, strada, numar_strada

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0003_programare'),
    ]

    operations = [
        migrations.AddField(
            model_name='pacient',
            name='judet',
            field=models.CharField(max_length=50, blank=True, default='', verbose_name='Județ'),
        ),
        migrations.AddField(
            model_name='pacient',
            name='localitate',
            field=models.CharField(max_length=100, blank=True, default='', verbose_name='Localitate'),
        ),
        migrations.AddField(
            model_name='pacient',
            name='strada',
            field=models.CharField(max_length=150, blank=True, default='', verbose_name='Strada'),
        ),
        migrations.AddField(
            model_name='pacient',
            name='numar_strada',
            field=models.CharField(max_length=20, blank=True, default='', verbose_name='Număr'),
        ),
        migrations.RemoveField(
            model_name='pacient',
            name='adresa',
        ),
    ]
