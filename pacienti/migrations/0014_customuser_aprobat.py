from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0013_configuratie_optional_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='aprobat',
            field=models.BooleanField(default=True),
        ),
    ]