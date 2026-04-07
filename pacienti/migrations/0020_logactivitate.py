from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0019_documentpacient'),
    ]

    operations = [
        migrations.CreateModel(
            name='LogActivitate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('actiune', models.CharField(choices=[('login','Login'),('logout','Logout'),('creare_pacient','Creare pacient'),('modificare_pacient','Modificare pacient'),('stergere_pacient','Ștergere pacient'),('creare_consultatie','Creare consultație'),('creare_reteta','Creare rețetă'),('creare_trimitere','Creare trimitere'),('creare_concediu','Creare concediu medical'),('aprobare_cerere','Aprobare cerere pacient'),('respingere_cerere','Respingere cerere pacient'),('export_xml','Export XML CNAS'),('upload_document','Upload document pacient'),('stergere_document','Ștergere document pacient'),('import_pacienti','Import Excel pacienți'),('creare_user','Creare utilizator'),('stergere_user','Ștergere utilizator')], max_length=50)),
                ('descriere', models.CharField(blank=True, max_length=255)),
                ('ip', models.GenericIPAddressField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='loguri', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Log activitate',
                'verbose_name_plural': 'Loguri activitate',
                'ordering': ['-timestamp'],
            },
        ),
    ]