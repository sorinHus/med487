from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import CustomUser, Pacient, Diagnostic, Consultatie, Programare, \
    DiagnosticConsultatie, ConfiguratieCabinet, Reteta, LinieReteta, ConcediuMedical, Trimitere
from .serializers import (UserSerializer, PacientSerializer,
                          DiagnosticSerializer, ConsulatieSerializer,
                          ProgramareSerializer, ConfiguratieCabinetSerializer,
                          RetetaSerializer, RetetaCreateSerializer,
                          LinieRetetaSerializer, ConcediuMedicalSerializer,
                          TrimitereSerializer)
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Max, Q
from django.shortcuts import render, get_object_or_404
from datetime import date, timedelta


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
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(UserSerializer(request.user).data)


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
        data_str = request.query_params.get('data')
        if not data_str:
            return Response({'error': 'Parametrul data este obligatoriu.'}, status=400)
        try:
            data = datetime.strptime(data_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Format data invalid. Folositi YYYY-MM-DD.'}, status=400)

        medic_id = request.query_params.get('medic', 1)
        ora_start = time(8, 0)
        ora_end = time(17, 0)
        durata = 20

        programari_existente = Programare.objects.filter(
            data_ora__date=data,
            medic_id=medic_id,
            status__in=['programat', 'confirmat']
        ).values_list('data_ora', flat=True)

        ocupate = {p.strftime('%H:%M') for p in programari_existente}

        slots = []
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
    permission_classes = [IsAuthenticated]

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


class TrimitereViewSet(viewsets.ModelViewSet):
    serializer_class = TrimitereSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Trimitere.objects.select_related('pacient', 'medic', 'consultatie')
        pacient_id = self.request.query_params.get('pacient')
        if pacient_id:
            qs = qs.filter(pacient_id=pacient_id)
        return qs


def _varsta_din_cnp(cnp):
    """Calculeaza varsta din CNP. Returneaza string sau ''."""
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

@require_GET
def test_email(request):
    from django.core.mail import send_mail
    from django.conf import settings
    try:
        send_mail(
            subject='Test email Railway',
            message='Functioneaza!',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_CABINET],
            fail_silently=False,
        )
        return JsonResponse({'ok': True})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)