from datetime import date, timedelta

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import render, get_object_or_404

from .models import Reteta, LinieReteta, ConcediuMedical, Trimitere, ConfiguratieCabinet
from .serializers import (RetetaSerializer, RetetaCreateSerializer,
                          LinieRetetaSerializer, ConcediuMedicalSerializer, TrimitereSerializer)
from .views_utils import log_actiune, LUNI_RO


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
        'numar_trimitere':         trimitere.numar_trimitere,
        'data_emiterii':           trimitere.data_emiterii.strftime('%d.%m.%Y') if trimitere.data_emiterii else '',
        'valabilitate_zile':       trimitere.valabilitate_zile,
        'data_expirare':           data_expirare,
        'specialist':              trimitere.specialist,
        'specialist_display':      specialist_display,
        'specialist_custom':       trimitere.specialist_custom or '',
        'unitate_medicala':        trimitere.unitate_medicala or '',
        'diagnostic':              trimitere.diagnostic or '',
        'cod_diagnostic':          trimitere.cod_diagnostic or '',
        'investigatii_solicitate': trimitere.investigatii_solicitate or '',
        'analize_selectate':       trimitere.analize_selectate or [],
        'prioritate':              trimitere.prioritate,
        'nr_fisa':                 trimitere.nr_fisa or '',
        'observatii':              trimitere.observatii or '',
        'pacient_nume':            pacient.nume,
        'pacient_prenume':         pacient.prenume,
        'cnp':                     cnp,
        'cnp_lista':               cnp_lista,
        'varsta':                  varsta,
        'sex':                     pacient.sex or '',
        'judet':                   pacient.judet or '',
        'localitate':              pacient.localitate or '',
        'strada':                  pacient.strada or '',
        'numar_strada':            pacient.numar_strada or '',
        'grup_sangvin':            pacient.grup_sangvin or '',
        'medic_nume':              f'{medic.last_name} {medic.first_name}',
        'cod_parafa':              config.cod_parafă if config else '',
        'denumire_unitate':        config.denumire_unitate if config else '',
        'localitate_cabinet':      config.localitate if config else '',
        'judet_cabinet':           config.judet if config else '',
        'strada_cabinet':          config.strada if config else '',
        'numar_cabinet':           config.numar if config else '',
        'cui':                     config.cui if config else '',
        'telefon_cabinet':         config.telefon if config else '',
        'cas':                     'CAS Cluj',
        'nr_conventie':            '',
        'acut_subacut_cronic':     'acut',
    }

    if tip == 'cnas':
        investigatii_text = trimitere.investigatii_solicitate or ''
        linii_inv = [l.strip() for l in investigatii_text.split('\n') if l.strip()]
        if not linii_inv and trimitere.analize_selectate:
            linii_inv = list(trimitere.analize_selectate)
        linii_inv = linii_inv[:15]
        context['investigatii_randuri'] = [
            {'text': text, 'top': 135 + i * 6}
            for i, text in enumerate(linii_inv)
        ]
        return render(request, 'pacienti/trimitere_cnas_print.html', context)

    return render(request, 'pacienti/trimitere_simpla_print.html', context)
