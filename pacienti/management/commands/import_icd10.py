import csv
import os
from django.core.management.base import BaseCommand
from pacienti.models import Diagnostic

class Command(BaseCommand):
    help = 'Importa codurile ICD-10 din fisier CSV'

    def add_arguments(self, parser):
        parser.add_argument('csv_path', type=str)

    def handle(self, *args, **options):
        path = options['csv_path']
        if not os.path.exists(path):
            self.stderr.write(f'Fisier negasit: {path}')
            return

        importate = 0
        sarite = 0

        with open(path, encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                cod = row['cod'].strip().zfill(3)
                denumire = row['denumire'].strip()
                if not cod or not denumire:
                    continue
                _, created = Diagnostic.objects.get_or_create(
                    cod_icd10=cod,
                    defaults={'denumire': denumire}
                )
                if created:
                    importate += 1
                else:
                    sarite += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done: {importate} importate, {sarite} existente deja.'
        ))