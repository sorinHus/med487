from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CustomUser, Pacient, Diagnostic, Consultatie, Programare
from .serializers import (UserSerializer, PacientSerializer,
                          DiagnosticSerializer, ConsulatieSerializer,
                          ProgramareSerializer)

class PacientViewSet(viewsets.ModelViewSet):
    queryset = Pacient.objects.all()
    serializer_class = PacientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Pacient.objects.all()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(nume__icontains=search) | qs.filter(cnp__icontains=search)
        return qs

    @action(detail=True, methods=['get'])
    def consultatii(self, request, pk=None):
        pacient = self.get_object()
        consultatii = pacient.consultatii.all()
        serializer = ConsulatieSerializer(consultatii, many=True)
        return Response(serializer.data)

class ConsulatieViewSet(viewsets.ModelViewSet):
    queryset = Consultatie.objects.all()
    serializer_class = ConsulatieSerializer
    permission_classes = [permissions.IsAuthenticated]

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

class ProgramareViewSet(viewsets.ModelViewSet):
    queryset = Programare.objects.all()
    serializer_class = ProgramareSerializer

    def get_permissions(self):
        if self.action in ['create', 'list_slots']:
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