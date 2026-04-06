from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pacienti', '0017_configuratiecabinet_cas'),
    ]

    operations = [
        migrations.AddField(
            model_name='pacient',
            name='creat_la',
            field=models.DateTimeField(auto_now_add=True, null=True, blank=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='pacient',
            name='actualizat_la',
            field=models.DateTimeField(auto_now=True, null=True, blank=True),
        ),
    ]