from django.core.management.base import BaseCommand
from pacienti.models import Consultatie, DiagnosticPacient


class Command(BaseCommand):
    help = 'Preia diagnosticele din consultațiile existente în dosarul pacientului (DiagnosticPacient).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run', action='store_true',
            help='Afișează ce s-ar crea fără a scrie nimic în baza de date.'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        consultatii = Consultatie.objects.prefetch_related(
            'diagnosticconsultatie_set__diagnostic'
        ).select_related('pacient', 'medic').all()

        total_cons = consultatii.count()
        create_count = 0
        skip_count = 0

        self.stdout.write(f'Procesez {total_cons} consultații...')

        for consultatie in consultatii:
            for dc in consultatie.diagnosticconsultatie_set.all():
                exists = DiagnosticPacient.objects.filter(
                    pacient=consultatie.pacient,
                    diagnostic=dc.diagnostic,
                ).exists()

                if exists:
                    skip_count += 1
                    continue

                if not dry_run:
                    DiagnosticPacient.objects.create(
                        pacient=consultatie.pacient,
                        diagnostic=dc.diagnostic,
                        tip='activ',
                        sursa='consultatie',
                        consultatie=consultatie,
                        medic=consultatie.medic,
                    )
                create_count += 1
                self.stdout.write(
                    f'  {"[DRY-RUN] " if dry_run else ""}Creat: '
                    f'{consultatie.pacient} ← {dc.diagnostic.cod_icd10} {dc.diagnostic.denumire}'
                )

        prefix = '[DRY-RUN] ' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'\n{prefix}Gata. Create: {create_count} | Deja existente (sărite): {skip_count}'
        ))
