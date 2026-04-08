from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0020_logactivitate'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentpacient',
            name='categorie',
            field=models.CharField(max_length=50, default='document'),
        ),
    ]