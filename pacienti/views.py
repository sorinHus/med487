from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CustomUser, Pacient, Diagnostic, Consultatie
from .serializers import (UserSerializer, PacientSerializer,
                          DiagnosticSerializer, ConsulatieSerializer)

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