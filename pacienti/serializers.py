from rest_framework import serializers
from .models import CustomUser, Pacient, Diagnostic, Consultatie, DiagnosticConsultatie

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'rol']

class DiagnosticSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnostic
        fields = ['id', 'cod_icd10', 'denumire']

class DiagnosticConsulatieSerializer(serializers.ModelSerializer):
    diagnostic = DiagnosticSerializer(read_only=True)
    diagnostic_id = serializers.PrimaryKeyRelatedField(
        queryset=Diagnostic.objects.all(), source='diagnostic', write_only=True
    )

    class Meta:
        model = DiagnosticConsultatie
        fields = ['id', 'diagnostic', 'diagnostic_id', 'tip']

class ConsulatieSerializer(serializers.ModelSerializer):
    diagnostice = DiagnosticConsulatieSerializer(
        source='diagnosticconsultatie_set', many=True, read_only=True
    )
    medic_nume = serializers.CharField(source='medic.get_full_name', read_only=True)

    class Meta:
        model = Consultatie
        fields = ['id', 'pacient', 'medic', 'medic_nume', 'data_ora',
                  'simptome', 'examen_clinic', 'tratament', 'observatii', 'diagnostice']

class PacientSerializer(serializers.ModelSerializer):
    consultatii_count = serializers.SerializerMethodField()

    class Meta:
        model = Pacient
        fields = ['id', 'cnp', 'nume', 'prenume', 'data_nastere', 'sex',
                  'telefon', 'email', 'adresa', 'grup_sangvin', 'alergii',
                  'data_inregistrare', 'status', 'medic', 'consultatii_count']

    def get_consultatii_count(self, obj):
        return obj.consultatii.count()