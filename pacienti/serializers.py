from rest_framework import serializers
from .models import CustomUser, Pacient, Diagnostic, Consultatie, Programare, DiagnosticConsultatie

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
    pacient_nume = serializers.SerializerMethodField()
    diagnostice_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, default=list
    )

    def get_pacient_nume(self, obj):
        return f"{obj.pacient.nume} {obj.pacient.prenume}"

    class Meta:
        model = Consultatie
        fields = ['id', 'pacient', 'medic', 'medic_nume', 'pacient_nume', 'data_ora',
                  'simptome', 'examen_clinic', 'tratament', 'observatii',
                  'diagnostice', 'diagnostice_ids']

    def create(self, validated_data):
        diagnostice_ids = validated_data.pop('diagnostice_ids', [])
        consultatie = super().create(validated_data)
        for diag_id in diagnostice_ids:
            DiagnosticConsultatie.objects.create(
                consultatie=consultatie,
                diagnostic_id=diag_id,
                tip='principal' if diag_id == diagnostice_ids[0] else 'secundar'
            )
        return consultatie
class PacientSerializer(serializers.ModelSerializer):
    consultatii_count = serializers.IntegerField(read_only=True, default=0)
    ultima_consultatie = serializers.DateTimeField(read_only=True, default=None)

    class Meta:
        model = Pacient
        fields = ['id', 'cnp', 'nume', 'prenume', 'data_nastere', 'sex', 'telefon', 
          'email', 'adresa', 'grup_sangvin', 'alergii', 'data_inregistrare', 
          'status', 'medic', 'consultatii_count', 'ultima_consultatie']

    def get_consultatii_count(self, obj):
        return obj.consultatii.count()
    
class ProgramareSerializer(serializers.ModelSerializer):
    pacient_nume_complet = serializers.SerializerMethodField()

    class Meta:
        model = Programare
        fields = ['id', 'pacient', 'medic', 'data_ora', 'durata_min',
                  'motiv', 'nume_pacient', 'telefon_pacient', 'email_pacient',
                  'status', 'creat_la', 'pacient_nume_complet']
        read_only_fields = ['creat_la']

    def get_pacient_nume_complet(self, obj):
        if obj.pacient:
            return f"{obj.pacient.nume} {obj.pacient.prenume}"
        return obj.nume_pacient