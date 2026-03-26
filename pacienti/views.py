from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CustomUser, Pacient, Diagnostic, Consultatie, Programare
from .serializers import (UserSerializer, PacientSerializer,
                          DiagnosticSerializer, ConsulatieSerializer,
                          ProgramareSerializer)
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Max, Q

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

# pacienti/views.py
class ConsulatieViewSet(viewsets.ModelViewSet):
    serializer_class = ConsulatieSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['simptome', 'pacient__nume', 'pacient__prenume', 'medic__last_name']

    def get_queryset(self):
        return Consultatie.objects.select_related('pacient', 'medic').prefetch_related('diagnostice')

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
            from datetime import datetime, timedelta
            start = datetime.strptime(saptamana, '%Y-%m-%d').date()
            end = start + timedelta(days=6)
            qs = qs.filter(data_ora__date__range=[start, end])
        return qs

    def perform_create(self, serializer):
        programare = serializer.save()
        self._trimite_emailuri(programare)

    def _trimite_emailuri(self, p):
        from datetime import datetime
        LUNI_RO = ['ianuarie','februarie','martie','aprilie','mai','iunie',
           'iulie','august','septembrie','octombrie','noiembrie','decembrie']
        data = f"{p.data_ora.day} {LUNI_RO[p.data_ora.month - 1]} {p.data_ora.year}"
        ora  = p.data_ora.strftime('%H:%M')
        nume = str(p.pacient) if p.pacient else p.nume_pacient

        # Email catre pacient
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

        # Email catre cabinet
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
        from datetime import datetime, timedelta, time
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
