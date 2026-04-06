import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0014_customuser_aprobat'),
    ]

    operations = [
        migrations.AddField(
            model_name='pacient',
            name='user',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='pacient_profil',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]