from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0015_pacient_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='pacient',
            name='nume_anterior',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Nume anterior'),
        ),
    ]