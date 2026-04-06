from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0018_pacient_timestamps'),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentPacient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nume', models.CharField(max_length=255, verbose_name='Nume document')),
                ('fisier_url', models.URLField(max_length=500, verbose_name='URL fișier')),
                ('fisier_key', models.CharField(max_length=500, verbose_name='Cheie R2')),
                ('marime', models.PositiveIntegerField(default=0, verbose_name='Mărime (bytes)')),
                ('incarcat_la', models.DateTimeField(auto_now_add=True)),
                ('pacient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='documente', to='pacienti.pacient')),
                ('incarcat_de', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='documente_incarcate', to='pacienti.customuser')),
            ],
            options={
                'ordering': ['-incarcat_la'],
            },
        ),
    ]