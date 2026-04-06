from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0016_pacient_nume_anterior'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuratiecabinet',
            name='nr_contract_cas',
            field=models.CharField(blank=True, max_length=30, verbose_name='Nr. contract CAS'),
        ),
        migrations.AddField(
            model_name='configuratiecabinet',
            name='cod_cas',
            field=models.CharField(blank=True, max_length=10, verbose_name='Cod CAS județean (ex: CJ)'),
        ),
    ]