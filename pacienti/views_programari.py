import json as json_module
import urllib.request

from rest_framework import viewsets, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse

from .models import Programare, ConfiguratieCabinet
from .serializers import ProgramareSerializer, ConfiguratieCabinetSerializer
from .views_utils import log_actiune, LUNI_RO


class ProgramareViewSet(viewsets.ModelViewSet):
    queryset = Programare.objects.all()
    serializer_class = ProgramareSerializer

    def get_permissions(self):
        if self.action in ['create', 'slots_libere']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Programare.objects.all()
        data = self.request.query_params.get('data')
        if data:
            qs = qs.filter(data_ora__date=data)
        saptamana = self.request.query_params.get('saptamana')
        if saptamana:
            from datetime import datetime, timedelta
            start = datetime.strptime(saptamana, '%Y-%m-%d').date()
            end = start + timedelta(days=6)
            qs = qs.filter(data_ora__date__range=[start, end])
        return qs

    def perform_create(self, serializer):
        programare = serializer.save()
        try:
            self._trimite_emailuri(programare)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"EMAIL ERROR: {e}")

    def perform_update(self, serializer):
        instance = serializer.save()
        if self.request.user.is_authenticated:
            log_actiune(self.request, 'modificare_programare',
                        f'{instance.data_ora:%d.%m.%Y %H:%M} — status: {instance.status}')

    def _trimite_emailuri(self, p):
        data = f"{p.data_ora.day} {LUNI_RO[p.data_ora.month - 1]} {p.data_ora.year}"
        ora = p.data_ora.strftime('%H:%M')
        nume = str(p.pacient) if p.pacient else p.nume_pacient

        if p.email_pacient:
            try:
                send_mail(
                    subject='Confirmare programare — Cabinet Medical',
                    message=(
                        f'Buna ziua, {nume},\n\n'
                        f'Programarea dumneavoastra a fost inregistrata:\n'
                        f'  Data:  {data}\n'
                        f'  Ora:   {ora}\n'
                        f'  Motiv: {p.motiv or "—"}\n\n'
                        f'Va rugam sa anulati cu cel putin 2 ore inainte daca nu puteti ajunge.\n\n'
                        f'Cabinet Medical MED487'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[p.email_pacient],
                    fail_silently=True,
                )
            except Exception:
                pass

        try:
            send_mail(
                subject=f'Programare noua — {nume} — {data} {ora}',
                message=(
                    f'Programare noua inregistrata:\n\n'
                    f'  Pacient: {nume}\n'
                    f'  Telefon: {p.telefon_pacient or "—"}\n'
                    f'  Email:   {p.email_pacient or "—"}\n'
                    f'  Data:    {data}\n'
                    f'  Ora:     {ora}\n'
                    f'  Motiv:   {p.motiv or "—"}\n'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.EMAIL_CABINET],
                fail_silently=True,
            )
        except Exception:
            pass

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def slots_libere(self, request):
        from datetime import datetime, timedelta
        import pytz

        data_str = request.query_params.get('data')
        if not data_str:
            return Response({'error': 'Parametrul data este obligatoriu.'}, status=400)
        try:
            data = datetime.strptime(data_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format data invalid. Folositi YYYY-MM-DD.'}, status=400)

        medic_id = request.query_params.get('medic', 1)
        tz = pytz.timezone('Europe/Bucharest')

        ZILE_MAP = {0: 'luni', 1: 'marti', 2: 'miercuri', 3: 'joi', 4: 'vineri', 5: 'sambata', 6: 'duminica'}
        zi_nume = ZILE_MAP[data.weekday()]

        orar_default = {
            'luni':     {'activ': True,  'intervale': [{'start': '13:00', 'end': '18:00'}]},
            'marti':    {'activ': True,  'intervale': [{'start': '08:00', 'end': '13:00'}]},
            'miercuri': {'activ': True,  'intervale': [{'start': '13:00', 'end': '18:00'}]},
            'joi':      {'activ': True,  'intervale': [{'start': '08:00', 'end': '13:00'}]},
            'vineri':   {'activ': True,  'intervale': [{'start': '13:00', 'end': '18:00'}]},
            'sambata':  {'activ': False, 'intervale': []},
            'duminica': {'activ': False, 'intervale': []},
        }

        try:
            config = ConfiguratieCabinet.objects.first()
            orar = config.orar_saptamanal if config and config.orar_saptamanal else orar_default
        except Exception:
            orar = orar_default

        zi_config = orar.get(zi_nume, {'activ': False, 'intervale': []})
        if not zi_config.get('activ', False):
            return Response([])

        try:
            durata = int(config.durata_slot) if config and config.durata_slot else 20
        except Exception:
            durata = 20

        programari_existente = Programare.objects.filter(
            data_ora__date=data, medic_id=medic_id,
            status__in=['programat', 'confirmat']
        ).values_list('data_ora', flat=True)

        ocupate = {p.astimezone(tz).strftime('%H:%M') for p in programari_existente}

        slots = []
        for interval in zi_config.get('intervale', []):
            try:
                ora_start = datetime.strptime(interval['start'], '%H:%M').time()
                ora_end = datetime.strptime(interval['end'], '%H:%M').time()
            except Exception:
                continue
            ora_curenta = datetime.combine(data, ora_start)
            ora_limita = datetime.combine(data, ora_end)
            while ora_curenta < ora_limita:
                slot_str = ora_curenta.strftime('%H:%M')
                slots.append({'ora': slot_str, 'liber': slot_str not in ocupate})
                ora_curenta += timedelta(minutes=durata)

        return Response(slots)


class ConfiguratieCabinetViewSet(viewsets.ModelViewSet):
    serializer_class = ConfiguratieCabinetSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return ConfiguratieCabinet.objects.all()

    def list(self, request, *args, **kwargs):
        obj = ConfiguratieCabinet.get()
        return Response(self.get_serializer(obj).data)

    def update(self, request, *args, **kwargs):
        obj = ConfiguratieCabinet.get()
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def zile_libere_view(request):
    year = request.GET.get('year', '2026')
    try:
        url = f'https://zilelibere.webventure.ro/api/{year}'
        with urllib.request.urlopen(url, timeout=5) as resp:
            data = json_module.loads(resp.read())
        return JsonResponse(data, safe=False)
    except Exception:
        return JsonResponse([], safe=False)
