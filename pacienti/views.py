from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django_ratelimit.decorators import ratelimit
from django_ratelimit.exceptions import Ratelimited
from django.utils.decorators import method_decorator
from .models import CustomUser, Pacient, Diagnostic, Consultatie, Programare, \
    DiagnosticConsultatie, ConfiguratieCabinet, Reteta, LinieReteta, ConcediuMedical, Trimitere, \
    ModuleUtilizator
from .serializers import (UserSerializer, PacientSerializer,
                          DiagnosticSerializer, ConsulatieSerializer,
                          ProgramareSerializer, ConfiguratieCabinetSerializer,
                          RetetaSerializer, RetetaCreateSerializer,
                          LinieRetetaSerializer, ConcediuMedicalSerializer,
                          TrimitereSerializer, ProfilMedicSerializer, SchimbareParolaSerializer, ModuleUtilizatorSerializer)
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Max, Q
from django.shortcuts import render, get_object_or_404
from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.hashers import make_password
import boto3
import os
import uuid


def log_actiune(request, actiune, descriere=''):
    try:
        from .models import LogActivitate
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')
        LogActivitate.objects.create(
            user=request.user if request.user.is_authenticated else None,
            actiune=actiune,
            descriere=descriere,
            ip=ip or None,
        )
    except Exception:
        pass


LUNI_RO = [
    '', 'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'
]


class PacientViewSet(viewsets.ModelViewSet):
    serializer_class = PacientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Pacient.objects.annotate(
            ultima_consultatie=Max('consultatii__data_ora')
        )
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(nume__icontains=search) |
                Q(prenume__icontains=search) |
                Q(cnp__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(medic=self.request.user)
        log_actiune(self.request, 'creare_pacient', f'{instance.nume} {instance.prenume}')

    
    def perform_destroy(self, instance):
        log_actiune(self.request, 'stergere_pacient', f'{instance.nume} {instance.prenume}')
        instance.delete()

    @action(detail=True, methods=['get'])
    def consultatii(self, request, pk=None):
        pacient = self.get_object()
        consultatii = pacient.consultatii.all()
        serializer = ConsulatieSerializer(consultatii, many=True)
        return Response(serializer.data)


class ConsulatieViewSet(viewsets.ModelViewSet):
    serializer_class = ConsulatieSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['simptome', 'pacient__nume', 'pacient__prenume', 'medic__last_name']

    def get_queryset(self):
        qs = Consultatie.objects.select_related('pacient', 'medic').prefetch_related('diagnostice')
        data_dupa = self.request.query_params.get('data_dupa')
        data_inainte = self.request.query_params.get('data_inainte')
        if data_dupa:
            qs = qs.filter(data_ora__date__gte=data_dupa)
        if data_inainte:
            qs = qs.filter(data_ora__date__lte=data_inainte)
        return qs

    def perform_create(self, serializer):
        consultatie = serializer.save()
        try:
            from django.utils import timezone
            azi = timezone.localdate()
            Programare.objects.filter(
                pacient=consultatie.pacient,
                data_ora__date=azi,
                status__in=['programat', 'confirmat']
            ).update(status='finalizat')
        except Exception:
            pass
        log_actiune(self.request, 'creare_consultatie', f'Pacient ID {consultatie.pacient_id}')


class DiagnosticViewSet(viewsets.ModelViewSet):
    queryset = Diagnostic.objects.all()
    serializer_class = DiagnosticSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Diagnostic.objects.all()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(cod_icd10__icontains=search) | qs.filter(denumire__icontains=search)
        return qs


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CustomUser.objects.all().order_by('id')
        rol = self.request.query_params.get('rol')
        aprobat = self.request.query_params.get('aprobat')
        if rol:
            qs = qs.filter(rol=rol)
        if aprobat is not None:
            qs = qs.filter(aprobat=aprobat.lower() == 'true')
        return qs

    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    @action(detail=True, methods=['post'])
    def toggle_activ(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active})

    def perform_create(self, serializer):
        instance = serializer.save()
        log_actiune(self.request, 'creare_user', f'{instance.username} ({instance.rol})')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        log_actiune(request, 'stergere_user', f'{instance.username} ({instance.rol})')
        return super().destroy(request, *args, **kwargs)


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
            from datetime import datetime
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
        ora  = p.data_ora.strftime('%H:%M')
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
        from datetime import datetime, time
        import pytz
        data_str = request.query_params.get('data')
        if not data_str:
            return Response({'error': 'Parametrul data este obligatoriu.'}, status=400)
        try:
            data = datetime.strptime(data_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format data invalid. Folositi YYYY-MM-DD.'}, status=400)

        medic_id = request.query_params.get('medic', 1)
        durata = 20
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
            config_durata = config.durata_slot if config else 20
            durata = int(config_durata) if config_durata else 20
        except Exception:
            durata = 20

        programari_existente = Programare.objects.filter(
            data_ora__date=data,
            medic_id=medic_id,
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
                slots.append({
                    'ora': slot_str,
                    'liber': slot_str not in ocupate
                })
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
        serializer = self.get_serializer(obj)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        obj = ConfiguratieCabinet.get()
        serializer = self.get_serializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RetetaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['numar_reteta', 'pacient__nume', 'pacient__prenume', 'diagnostic']

    def get_queryset(self):
        qs = Reteta.objects.select_related('pacient', 'medic', 'consultatie').prefetch_related('linii')
        pacient_id = self.request.query_params.get('pacient')
        if pacient_id:
            qs = qs.filter(pacient_id=pacient_id)
        return qs

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RetetaCreateSerializer
        return RetetaSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        log_actiune(self.request, 'creare_reteta', f'{instance.numar_reteta} — {instance.pacient}')


class LinieRetetaViewSet(viewsets.ModelViewSet):
    serializer_class = LinieRetetaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LinieReteta.objects.filter(reteta__medic=self.request.user)


class ConcediuMedicalViewSet(viewsets.ModelViewSet):
    serializer_class = ConcediuMedicalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ConcediuMedical.objects.select_related('pacient', 'medic', 'consultatie')
        pacient_id = self.request.query_params.get('pacient')
        if pacient_id:
            qs = qs.filter(pacient_id=pacient_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        log_actiune(self.request, 'creare_concediu', f'{instance.serie_numar} — {instance.pacient}')


class TrimitereViewSet(viewsets.ModelViewSet):
    serializer_class = TrimitereSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Trimitere.objects.select_related('pacient', 'medic', 'consultatie')
        pacient_id = self.request.query_params.get('pacient')
        if pacient_id:
            qs = qs.filter(pacient_id=pacient_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save()
        log_actiune(self.request, 'creare_trimitere', f'{instance.numar_trimitere} — {instance.pacient}')


def _varsta_din_cnp(cnp):
    try:
        if cnp and len(cnp) == 13:
            s = int(cnp[0])
            an2 = int(cnp[1:3])
            luna_n = int(cnp[3:5])
            zi_n = int(cnp[5:7])
            if s in (1, 2):
                an_nastere = 1900 + an2
            elif s in (3, 4):
                an_nastere = 1800 + an2
            elif s in (5, 6):
                an_nastere = 2000 + an2
            else:
                an_nastere = 1900 + an2
            azi = date.today()
            varsta = azi.year - an_nastere - ((azi.month, azi.day) < (luna_n, zi_n))
            return str(varsta)
    except Exception:
        pass
    return ''


def print_concediu(request, pk):
    concediu = get_object_or_404(ConcediuMedical, pk=pk)
    cabinet = ConfiguratieCabinet.get()
    pacient = concediu.pacient

    context = {
        'serie_numar':         concediu.serie_numar,
        'tip':                 concediu.tip,
        'serie_initial':       concediu.serie_initial,
        'luna_text':           LUNI_RO[concediu.luna],
        'an':                  concediu.an,
        'cod_indemnizatie':    concediu.cod_indemnizatie,
        'pacient_nume':        pacient.nume,
        'pacient_prenume':     pacient.prenume,
        'cnp':                 pacient.cnp,
        'judet':               pacient.judet,
        'localitate':          pacient.localitate,
        'strada':              pacient.strada,
        'numar_strada':        pacient.numar_strada,
        'data_acordarii_zi':   concediu.data_acordarii.strftime('%d'),
        'data_acordarii_luna': concediu.data_acordarii.strftime('%m'),
        'data_acordarii_an':   concediu.data_acordarii.strftime('%y'),
        'nr_zile':             concediu.nr_zile,
        'de_la_zi':            concediu.de_la.strftime('%d'),
        'de_la_luna':          concediu.de_la.strftime('%m'),
        'de_la_an':            concediu.de_la.strftime('%y'),
        'pana_la_zi':          concediu.pana_la.strftime('%d'),
        'pana_la_luna':        concediu.pana_la.strftime('%m'),
        'pana_la_an':          concediu.pana_la.strftime('%y'),
        'cod_diagnostic':      concediu.cod_diagnostic,
        'acut_subacut_cronic': concediu.acut_subacut_cronic,
        'nr_inreg':            concediu.nr_inreg,
        'ambulator_internat':  concediu.ambulator_internat,
        'nr_conventie':        concediu.nr_conventie,
        'cas':                 concediu.cas,
        'denumire_unitate':    cabinet.denumire_unitate,
        'cui':                 cabinet.cui,
        'cod_parafa':          cabinet.cod_parafă,
    }

    return render(request, 'pacienti/concediu_print.html', context)


def print_reteta(request, pk):
    reteta = get_object_or_404(
        Reteta.objects.select_related('pacient', 'medic').prefetch_related('linii'),
        pk=pk
    )
    cabinet = ConfiguratieCabinet.get()
    pacient = reteta.pacient

    azi = date.today()
    try:
        cnp = pacient.cnp
        s = int(cnp[0])
        an2 = int(cnp[1:3])
        luna = int(cnp[3:5])
        zi = int(cnp[5:7])
        if s in (1, 2):
            an = 1900 + an2
        elif s in (3, 4):
            an = 1800 + an2
        elif s in (5, 6):
            an = 2000 + an2
        else:
            an = 1900 + an2
        data_nastere_cnp = date(an, luna, zi)
        varsta = azi.year - data_nastere_cnp.year - (
            (azi.month, azi.day) < (data_nastere_cnp.month, data_nastere_cnp.day)
        )
    except Exception:
        varsta = azi.year - pacient.data_nastere.year - (
            (azi.month, azi.day) < (pacient.data_nastere.month, pacient.data_nastere.day)
        )

    cnp_lista = list(pacient.cnp) if pacient.cnp else [''] * 13
    data_expirare = reteta.data_emiterii + timedelta(days=reteta.valabilitate_zile)

    context = {
        'denumire_unitate':   cabinet.denumire_unitate,
        'localitate_cabinet': cabinet.localitate,
        'judet_cabinet':      cabinet.judet,
        'strada_cabinet':     cabinet.strada,
        'numar_cabinet':      cabinet.numar,
        'cui':                cabinet.cui,
        'cod_parafa':         cabinet.cod_parafă,
        'numar_reteta':       reteta.numar_reteta,
        'data_emiterii':      reteta.data_emiterii.strftime('%d.%m.%Y'),
        'valabilitate_zile':  reteta.valabilitate_zile,
        'data_expirare':      data_expirare.strftime('%d.%m.%Y'),
        'gratuit':            reteta.gratuit,
        'diagnostic':         reteta.diagnostic,
        'cod_diagnostic':     '',
        'nr_fisa':            reteta.nr_fisa,
        'nr_conventie':       reteta.nr_conventie if hasattr(reteta, 'nr_conventie') else '',
        'linii':              reteta.linii.all(),
        'medic_nume':         reteta.medic.get_full_name(),
        'pacient_nume':       pacient.nume,
        'pacient_prenume':    pacient.prenume,
        'cnp_lista':          cnp_lista,
        'varsta':             varsta,
        'sex':                pacient.sex,
        'grup_sangvin':       pacient.grup_sangvin,
        'judet':              pacient.judet,
        'localitate':         pacient.localitate,
        'strada':             pacient.strada,
        'numar_strada':       pacient.numar_strada,
    }

    return render(request, 'pacienti/reteta_print.html', context)


def print_trimitere(request, pk):
    trimitere = get_object_or_404(Trimitere, pk=pk)
    pacient = trimitere.pacient
    medic = trimitere.medic
    tip = request.GET.get('tip', 'simplu')

    try:
        config = ConfiguratieCabinet.get()
    except Exception:
        config = None

    cnp = pacient.cnp or ''
    cnp_lista = list(cnp.ljust(13))[:13]
    varsta = _varsta_din_cnp(cnp)

    specialist_choices = dict(Trimitere.SPECIALIST_CHOICES)
    specialist_display = specialist_choices.get(trimitere.specialist, trimitere.specialist)

    data_expirare = ''
    if trimitere.data_emiterii and trimitere.valabilitate_zile:
        exp = trimitere.data_emiterii + timedelta(days=trimitere.valabilitate_zile)
        data_expirare = exp.strftime('%d.%m.%Y')

    context = {
        'numar_trimitere':     trimitere.numar_trimitere,
        'data_emiterii':       trimitere.data_emiterii.strftime('%d.%m.%Y') if trimitere.data_emiterii else '',
        'valabilitate_zile':   trimitere.valabilitate_zile,
        'data_expirare':       data_expirare,
        'specialist':          trimitere.specialist,
        'specialist_display':  specialist_display,
        'specialist_custom':   trimitere.specialist_custom or '',
        'unitate_medicala':    trimitere.unitate_medicala or '',
        'diagnostic':          trimitere.diagnostic or '',
        'cod_diagnostic':      trimitere.cod_diagnostic or '',
        'investigatii_solicitate': trimitere.investigatii_solicitate or '',
        'prioritate':          trimitere.prioritate,
        'nr_fisa':             trimitere.nr_fisa or '',
        'observatii':          trimitere.observatii or '',
        'pacient_nume':        pacient.nume,
        'pacient_prenume':     pacient.prenume,
        'cnp':                 cnp,
        'cnp_lista':           cnp_lista,
        'varsta':              varsta,
        'sex':                 pacient.sex or '',
        'judet':               pacient.judet or '',
        'localitate':          pacient.localitate or '',
        'strada':              pacient.strada or '',
        'numar_strada':        pacient.numar_strada or '',
        'grup_sangvin':        pacient.grup_sangvin or '',
        'medic_nume':          f'{medic.last_name} {medic.first_name}',
        'cod_parafa':          config.cod_parafă if config else '',
        'denumire_unitate':    config.denumire_unitate if config else '',
        'localitate_cabinet':  config.localitate if config else '',
        'judet_cabinet':       config.judet if config else '',
        'strada_cabinet':      config.strada if config else '',
        'numar_cabinet':       config.numar if config else '',
        'cui':                 config.cui if config else '',
        'telefon_cabinet':     config.telefon if config else '',
        'cas':                 'CAS Cluj',
        'nr_conventie':        '',
        'acut_subacut_cronic': 'acut',
    }

    if tip == 'cnas':
        investigatii_text = trimitere.investigatii_solicitate or ''
        linii_inv = [l.strip() for l in investigatii_text.split('\n') if l.strip()][:15]
        context['investigatii_randuri'] = [
            {'text': text, 'top': 135 + i * 6}
            for i, text in enumerate(linii_inv)
        ]
        return render(request, 'pacienti/trimitere_cnas_print.html', context)

    return render(request, 'pacienti/trimitere_simpla_print.html', context)


from django.http import JsonResponse
from django.views.decorators.http import require_GET


class ProfilMedicView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfilMedicSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class SchimbareParolaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SchimbareParolaSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if not user.check_password(serializer.validated_data['parola_veche']):
            return Response({'parola_veche': 'Parolă incorectă.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['parola_noua'])
        user.save()
        return Response({'detail': 'Parola a fost schimbată cu succes.'})


class ModuleUtilizatorViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, pk=None):
        obj, _ = ModuleUtilizator.objects.get_or_create(user_id=pk)
        return Response({'active': obj.active})

    def update(self, request, pk=None):
        obj, _ = ModuleUtilizator.objects.get_or_create(user_id=pk)
        obj.active = request.data.get('active', [])
        obj.save()
        return Response({'active': obj.active})


import json as json_module
import urllib.request


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


@method_decorator(ratelimit(key='ip', rate='10/h', method='POST', block=True), name='post')
class VerificareCNPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        cnp = request.data.get('cnp', '').strip()
        if not cnp:
            return Response({'error': 'CNP lipsă'}, status=400)
        pacient = Pacient.objects.filter(cnp=cnp).first()
        if pacient:
            return Response({
                'gasit': True,
                'nume': pacient.nume,
                'prenume': pacient.prenume,
                'localitate': pacient.localitate or '',
                'judet': pacient.judet or '',
            })
        return Response({'gasit': False})


@method_decorator(ratelimit(key='ip', rate='5/h', method='POST', block=True), name='post')
class InregistrarePacientView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import traceback
        data = request.data
        cnp = data.get('cnp', '').strip()
        email = data.get('email', '').strip()
        username = cnp

        if CustomUser.objects.filter(username=username).exists():
            return Response({'error': 'Există deja un cont asociat acestui CNP.'}, status=400)

        pacient_existent = Pacient.objects.filter(cnp=cnp).first()
        if pacient_existent and pacient_existent.user is not None:
            return Response({'error': 'Există deja un cont asociat acestui CNP.'}, status=400)

        try:
            user = CustomUser.objects.create(
                username=username,
                email=email,
                first_name=data.get('prenume', ''),
                last_name=data.get('nume', ''),
                telefon=data.get('telefon', ''),
                rol='pacient',
                aprobat=False,
                is_active=True,
                password=make_password(data.get('parola', '')),
            )

            if pacient_existent:
                pacient_existent.user = user
                pacient_existent.save()
            else:
                from datetime import date
                an2 = cnp[1:3]
                luna = cnp[3:5]
                zi = cnp[5:7]
                s = cnp[0]
                if s in ('1', '2'):
                    an = int('19' + an2)
                elif s in ('5', '6'):
                    an = int('20' + an2)
                else:
                    an = int('19' + an2)
                try:
                    dn = date(an, int(luna), int(zi))
                except Exception:
                    dn = date(2000, 1, 1)

                Pacient.objects.create(
                    user=user,
                    medic=CustomUser.objects.filter(rol='medic').first(),
                    nume=data.get('nume', ''),
                    prenume=data.get('prenume', ''),
                    cnp=cnp,
                    data_nastere=dn,
                    telefon=data.get('telefon', ''),
                    email=email,
                    judet=data.get('judet', ''),
                    localitate=data.get('localitate', ''),
                    strada=data.get('strada', ''),
                    numar_strada=data.get('numar', ''),
                )
            return Response({'ok': True})
        except Exception as e:
            return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)


class AprobarePacientView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.rol not in ['medic', 'asistent']:
            return Response({'error': 'Acces interzis'}, status=403)
        user = CustomUser.objects.filter(pk=pk, rol='pacient', aprobat=False).first()
        if not user:
            return Response({'error': 'Cerere negăsită'}, status=404)
        user.aprobat = True
        user.save()
        log_actiune(request, 'aprobare_cerere', f'{user.get_full_name()} ({user.username})')
        try:
            from django.core.mail import send_mail
            send_mail(
                subject='Cont aprobat — Cabinet Medical',
                message=f'Bună ziua, {user.first_name}!\n\nContul dumneavoastră a fost aprobat. Vă puteți loga la https://med487.pages.dev/app\n\nCu stimă,\nCabinet Medical',
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass
        return Response({'ok': True})

    def delete(self, request, pk):
        if request.user.rol not in ['medic', 'asistent']:
            return Response({'error': 'Acces interzis'}, status=403)
        user = CustomUser.objects.filter(pk=pk, rol='pacient', aprobat=False).first()
        if not user:
            return Response({'error': 'Cerere negăsită'}, status=404)
        log_actiune(request, 'respingere_cerere', f'{user.get_full_name()} ({user.username})')
        user.delete()
        return Response({'ok': True})


class PortalPacientView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.rol != 'pacient':
            return Response({'error': 'Acces interzis'}, status=403)
        try:
            pacient = user.pacient_profil
        except Exception:
            return Response({'programari': [], 'consultatii': [], 'retete': []})

        programari = Programare.objects.filter(pacient=pacient).order_by('-data_ora')[:20]
        consultatii = Consultatie.objects.filter(pacient=pacient).order_by('-data_ora')[:30]
        retete = Reteta.objects.filter(pacient=pacient).order_by('-data_emiterii').prefetch_related('linii')[:30]

        return Response({
            'programari': [
                {
                    'id': p.id,
                    'data_ora': p.data_ora,
                    'motiv': p.motiv or '—',
                    'status': p.status,
                }
                for p in programari
            ],
            'consultatii': [
                {
                    'id': c.id,
                    'data_ora': c.data_ora,
                    'simptome': c.simptome or '—',
                    'tratament': c.tratament or '—',
                    'medic': c.medic.get_full_name() or c.medic.username,
                }
                for c in consultatii
            ],
            'retete': [
                {
                    'id': r.id,
                    'numar': r.numar_reteta,
                    'data_prescriere': r.data_emiterii,
                    'diagnostic': r.diagnostic or '',
                    'gratuit': r.gratuit,
                    'linii': [
                        {
                            'nume_medicament': l.nume_medicament,
                            'concentratie': l.concentratie,
                            'doza_frecventa': l.doza_frecventa,
                            'cantitate': l.cantitate,
                            'durata_zile': l.durata_zile,
                        }
                        for l in r.linii.all()
                    ]
                }
                for r in retete
            ],
        })


@method_decorator(ratelimit(key='ip', rate='3/h', method='POST', block=True), name='post')
class ResetParolaView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        if not username:
            return Response({'error': 'Username obligatoriu.'}, status=400)
        user = CustomUser.objects.filter(username=username).first()
        if not user or not user.email:
            return Response({'ok': True})
        import random, string
        from django.core.mail import send_mail
        parola_noua = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        user.set_password(parola_noua)
        user.save()
        try:
            send_mail(
                subject='Resetare parolă — Cabinet Medical',
                message=f'Bună ziua, {user.first_name}!\n\nParola dumneavoastră a fost resetată.\nParolă temporară: {parola_noua}\n\nVă recomandăm să o schimbați după autentificare.\n\nCu stimă,\nCabinet Medical',
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass
        return Response({'ok': True})


from django.http import HttpResponse
import xml.etree.ElementTree as ET


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_xml_raportare(request):
    luna = request.GET.get('luna')
    an = request.GET.get('an')

    if not luna or not an:
        return HttpResponse('Parametrii luna si an sunt obligatorii.', status=400)

    luna = int(luna)
    an = int(an)

    from .models import ConfiguratieCabinet, Pacient, ConcediuMedical

    config = ConfiguratieCabinet.get()
    medic = request.user

    root = ET.Element('report')
    root.set('xmlns', 'http://www.cnas.ro/siui/2.0')

    physician = ET.SubElement(root, 'physician')
    physician.set('stencil', medic.parafa or '')
    physician.set('contractNo', config.nr_contract_cas or '')

    capita = ET.SubElement(physician, 'capita')
    pacienti = Pacient.objects.filter(medic=medic)

    for p in pacienti:
        enlisted = ET.SubElement(capita, 'enlisted')
        enlisted.set('AppID', str(p.id))
        enlisted.set('pid', p.cnp)
        enlisted.set('firstName', p.prenume)
        enlisted.set('lastName', p.nume)
        enlisted.set('birthDate', p.data_nastere.strftime('%Y-%m-%d'))
        enlisted.set('gender', '1' if p.sex == 'M' else '2')

        operations = ET.SubElement(enlisted, 'operations')
        op = ET.SubElement(operations, 'operation')
        op.set('AppID', f'OP-{p.id}')
        op.set('moveType', '1')
        op.set('date', p.data_inregistrare.strftime('%Y-%m-%d'))
        op.set('event', '1')

    concedii = ConcediuMedical.objects.filter(medic=medic, luna=luna, an=an)

    if concedii.exists():
        medicalNotes = ET.SubElement(physician, 'medicalNotes')
        for c in concedii:
            note = ET.SubElement(medicalNotes, 'medicalNote')
            note.set('AppID', str(c.id))
            note.set('stencilNo', medic.parafa or '')
            note.set('cid', c.pacient.cnp)
            note.set('serialCode', c.serie_numar[:4] if len(c.serie_numar) >= 4 else c.serie_numar)
            note.set('serialNo', c.serie_numar[4:] if len(c.serie_numar) > 4 else '')
            note.set('issueDate', c.data_acordarii.strftime('%Y-%m-%d'))
            note.set('ticketType', c.cod_indemnizatie)
            if c.cod_diagnostic:
                note.set('diagnostic', c.cod_diagnostic)

    tree = ET.ElementTree(root)
    ET.indent(tree, space='  ')

    log_actiune(request, 'export_xml', f'Anexa 006 — {luna:02d}/{an}')

    filename = f'raportare_MF_{an}_{luna:02d}.xml'
    response = HttpResponse(content_type='application/xml')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    ET.ElementTree(root).write(response, encoding='unicode', xml_declaration=True)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_xml_concedii(request):
    luna = request.GET.get('luna')
    an = request.GET.get('an')

    if not luna or not an:
        return HttpResponse('Parametrii luna si an sunt obligatorii.', status=400)

    luna = int(luna)
    an = int(an)

    from .models import ConfiguratieCabinet, ConcediuMedical

    config = ConfiguratieCabinet.get()
    medic = request.user

    concedii = ConcediuMedical.objects.filter(
        medic=medic, luna=luna, an=an
    ).select_related('pacient')

    root = ET.Element('report')
    root.set('xmlns', 'http://www.cnas.ro/siui/2.0')

    physician = ET.SubElement(root, 'physician')
    physician.set('stencil', medic.parafa or '')
    physician.set('contractNo', config.nr_contract_cas or '')

    medicalNotes = ET.SubElement(physician, 'medicalNotes')

    for c in concedii:
        note = ET.SubElement(medicalNotes, 'medicalNote')
        note.set('AppID', str(c.id))
        note.set('stencilNo', medic.parafa or '')
        note.set('cid', c.pacient.cnp)
        note.set('pid', c.pacient.cnp)
        note.set('firstName', c.pacient.prenume)
        note.set('lastName', c.pacient.nume)
        note.set('serialCode', c.serie_numar[:4] if len(c.serie_numar) >= 4 else c.serie_numar)
        note.set('serialNo', c.serie_numar[4:] if len(c.serie_numar) > 4 else '')
        note.set('issueDate', c.data_acordarii.strftime('%Y-%m-%d'))
        note.set('startDate', c.de_la.strftime('%Y-%m-%d') if c.de_la else '')
        note.set('endDate', c.pana_la.strftime('%Y-%m-%d') if c.pana_la else '')
        note.set('noOfDays', str(c.nr_zile))
        note.set('ticketType', c.cod_indemnizatie)
        note.set('emergeType', c.acut_subacut_cronic or 'acut')
        note.set('cardType', c.ambulator_internat or 'ambulator')
        if c.cod_diagnostic:
            note.set('diagnostic', c.cod_diagnostic)
        if c.tip == 'continuare' and c.serie_initial:
            note.set('initialSerialCode', c.serie_initial[:4] if len(c.serie_initial) >= 4 else c.serie_initial)
            note.set('initialSerialNo', c.serie_initial[4:] if len(c.serie_initial) > 4 else '')

    ET.indent(ET.ElementTree(root), space='  ')

    log_actiune(request, 'export_xml', f'Anexa 010 — {luna:02d}/{an}')

    filename = f'concedii_MF_{an}_{luna:02d}.xml'
    response = HttpResponse(content_type='application/xml')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    ET.ElementTree(root).write(response, encoding='unicode', xml_declaration=True)
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_pacienti_excel(request):
    import openpyxl
    from datetime import date

    fisier = request.FILES.get('fisier')
    if not fisier:
        return Response({'eroare': 'Niciun fișier trimis.'}, status=400)

    try:
        wb = openpyxl.load_workbook(fisier)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if len(rows) < 2:
            return Response({'eroare': 'Fișierul nu conține date.'}, status=400)

        header = [str(h).strip() if h else '' for h in rows[0]]

        def col(row, nume):
            try:
                idx = header.index(nume)
                val = row[idx]
                return str(val).strip() if val is not None else ''
            except ValueError:
                return ''

        medic = request.user
        importati = 0
        sarite = 0
        erori = []

        SEX_MAP = {'masculin': 'M', 'm': 'M', 'feminin': 'F', 'f': 'F'}
        GRUP_VALID = ['A+','A-','B+','B-','AB+','AB-','0+','0-']
        STATUS_VALID = ['activ','decedat','transferat','inactiv']

        for i, row in enumerate(rows[1:], start=2):
            cnp = col(row, 'CNP').replace(' ', '')
            if not cnp:
                continue

            if Pacient.objects.filter(cnp=cnp).exists():
                sarite += 1
                continue

            nume = col(row, 'Nume')
            prenume = col(row, 'Prenume')
            if not nume or not prenume:
                erori.append(f'Rândul {i}: Nume sau Prenume lipsă.')
                continue

            sex_raw = col(row, 'Sex').lower()
            sex = SEX_MAP.get(sex_raw, 'M')

            grup = col(row, 'Grup sangvin')
            if grup not in GRUP_VALID:
                grup = ''

            status = col(row, 'Status').lower()
            if status not in STATUS_VALID:
                status = 'activ'

            try:
                s = int(cnp[0])
                an2 = int(cnp[1:3])
                luna_n = int(cnp[3:5])
                zi_n = int(cnp[5:7])
                if s in [1,2]: an_n = 1900 + an2
                elif s in [3,4]: an_n = 1800 + an2
                elif s in [5,6]: an_n = 2000 + an2
                else: an_n = 1900 + an2
                data_nastere = date(an_n, luna_n, zi_n)
            except Exception:
                data_nastere = date(2000, 1, 1)

            try:
                Pacient.objects.create(
                    cnp=cnp, nume=nume, prenume=prenume,
                    data_nastere=data_nastere, sex=sex,
                    telefon=col(row, 'Telefon'), email=col(row, 'Email'),
                    judet=col(row, 'Judet'), localitate=col(row, 'Localitate'),
                    strada=col(row, 'Strada'), numar_strada=col(row, 'Nr.'),
                    grup_sangvin=grup, alergii=col(row, 'Alergii'),
                    status=status, medic=medic,
                )
                importati += 1
            except Exception as e:
                erori.append(f'Rândul {i} (CNP {cnp}): {str(e)}')

        log_actiune(request, 'import_pacienti', f'{importati} pacienți importați')

        return Response({'importati': importati, 'sarite': sarite, 'erori': erori})

    except Exception as e:
        return Response({'eroare': f'Eroare la citirea fișierului: {str(e)}'}, status=400)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def documente_pacient(request, pacient_id):
    from .models import DocumentPacient
    try:
        pacient = Pacient.objects.get(pk=pacient_id)
    except Pacient.DoesNotExist:
        return Response({'eroare': 'Pacient negăsit.'}, status=404)

    if request.method == 'GET':
        docs = DocumentPacient.objects.filter(pacient=pacient)
        return Response([{
            'id': d.id,
            'nume': d.nume,
            'fisier_url': d.fisier_url,
            'marime': d.marime,
            'incarcat_la': d.incarcat_la,
            'incarcat_de': d.incarcat_de.get_full_name() if d.incarcat_de else '—',
        } for d in docs])

    if request.method == 'POST':
        fisier = request.FILES.get('fisier')
        nume = request.data.get('nume', fisier.name if fisier else 'Document')
        if not fisier:
            return Response({'eroare': 'Niciun fișier trimis.'}, status=400)
        if fisier.size > 10 * 1024 * 1024:
            return Response({'eroare': 'Fișierul depășește 10MB.'}, status=400)

        try:
            s3 = boto3.client(
                's3',
                endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
                aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
                region_name='auto',
            )
            ext = fisier.name.rsplit('.', 1)[-1].lower()
            key = f"pacienti/{pacient_id}/{uuid.uuid4()}.{ext}"
            s3.upload_fileobj(
                fisier,
                os.environ['R2_BUCKET_NAME'],
                key,
                ExtraArgs={'ContentType': fisier.content_type}
            )
            url = f"{os.environ['R2_PUBLIC_URL']}/{key}"
            doc = DocumentPacient.objects.create(
                pacient=pacient, nume=nume,
                fisier_url=url, fisier_key=key,
                marime=fisier.size, incarcat_de=request.user,
            )
            log_actiune(request, 'upload_document', f'{doc.nume} — pacient ID {pacient_id}')
            return Response({
                'id': doc.id, 'nume': doc.nume,
                'fisier_url': doc.fisier_url, 'marime': doc.marime,
                'incarcat_la': doc.incarcat_la,
            }, status=201)
        except Exception as e:
            return Response({'eroare': f'Eroare upload: {str(e)}'}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def sterge_document(request, doc_id):
    from .models import DocumentPacient
    try:
        doc = DocumentPacient.objects.get(pk=doc_id)
    except DocumentPacient.DoesNotExist:
        return Response({'eroare': 'Document negăsit.'}, status=404)
    try:
        s3 = boto3.client(
            's3',
            endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
            aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
            region_name='auto',
        )
        s3.delete_object(Bucket=os.environ['R2_BUCKET_NAME'], Key=doc.fisier_key)
    except Exception:
        pass
    log_actiune(request, 'stergere_document', f'Document ID {doc_id}')
    doc.delete()
    return Response(status=204)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def loguri_activitate(request):
    from .models import LogActivitate
    if request.user.rol != 'superadmin':
        return Response({'detail': 'Acces interzis.'}, status=403)
    loguri = LogActivitate.objects.select_related('user').all()[:500]
    data = [{
        'id': l.id,
        'user': l.user.get_full_name() if l.user else '—',
        'username': l.user.username if l.user else '—',
        'actiune': l.actiune,
        'descriere': l.descriere,
        'ip': l.ip,
        'timestamp': l.timestamp.strftime('%d.%m.%Y %H:%M:%S'),
    } for l in loguri]
    return Response(data)