from rest_framework import serializers
from .models import CustomUser, Pacient, Diagnostic, Consultatie, Programare, \
    DiagnosticConsultatie, ConfiguratieCabinet, Reteta, LinieReteta, ConcediuMedical, Trimitere


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
                  'email', 'judet', 'localitate', 'strada', 'numar_strada',
                  'grup_sangvin', 'alergii', 'data_inregistrare',
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


class ConfiguratieCabinetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguratieCabinet
        fields = ['id', 'denumire_unitate', 'localitate', 'judet',
                  'strada', 'numar', 'telefon', 'email', 'cui', 'cod_parafă']


class LinieRetetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinieReteta
        fields = ['id', 'nume_medicament', 'concentratie', 'doza_frecventa',
                  'durata_zile', 'cantitate', 'observatii', 'ordine']


class RetetaSerializer(serializers.ModelSerializer):
    linii        = LinieRetetaSerializer(many=True, read_only=True)
    pacient_nume = serializers.SerializerMethodField()
    medic_nume   = serializers.CharField(source='medic.get_full_name', read_only=True)

    def get_pacient_nume(self, obj):
        return f'{obj.pacient.nume} {obj.pacient.prenume}'

    class Meta:
        model = Reteta
        fields = ['id', 'numar_reteta', 'pacient', 'pacient_nume', 'medic', 'medic_nume',
                  'consultatie', 'data_emiterii', 'valabilitate_zile', 'gratuit',
                  'diagnostic', 'nr_fisa', 'observatii', 'creat_la', 'linii']
        read_only_fields = ['numar_reteta', 'data_emiterii', 'creat_la']


class RetetaCreateSerializer(serializers.ModelSerializer):
    linii = LinieRetetaSerializer(many=True, required=False, default=list)

    class Meta:
        model = Reteta
        fields = ['id', 'numar_reteta', 'pacient', 'medic', 'consultatie',
                  'valabilitate_zile', 'gratuit', 'diagnostic', 'nr_fisa',
                  'observatii', 'data_emiterii', 'linii']
        read_only_fields = ['id', 'numar_reteta', 'data_emiterii']

    def create(self, validated_data):
        linii_data = validated_data.pop('linii', [])
        reteta = Reteta.objects.create(**validated_data)
        for i, linie in enumerate(linii_data):
            linie.pop('ordine', None)
            LinieReteta.objects.create(reteta=reteta, ordine=i, **linie)
        return reteta


class ConcediuMedicalSerializer(serializers.ModelSerializer):
    pacient_nume = serializers.SerializerMethodField()
    medic_nume   = serializers.CharField(source='medic.get_full_name', read_only=True)

    def get_pacient_nume(self, obj):
        return f'{obj.pacient.nume} {obj.pacient.prenume}'

    class Meta:
        model = ConcediuMedical
        fields = [
            'id', 'pacient', 'pacient_nume', 'medic', 'medic_nume', 'consultatie',
            'serie_numar', 'tip', 'serie_initial', 'luna', 'an', 'cod_indemnizatie',
            'data_acordarii', 'nr_zile', 'de_la', 'pana_la',
            'cod_diagnostic', 'acut_subacut_cronic', 'nr_inreg', 'ambulator_internat',
            'nr_conventie', 'cas', 'observatii', 'creat_la',
        ]
        read_only_fields = ['creat_la']


class TrimitereSerializer(serializers.ModelSerializer):
    pacient_nume = serializers.SerializerMethodField()
    medic_nume   = serializers.SerializerMethodField()
    data_emiterii = serializers.DateField(read_only=True)

    def get_pacient_nume(self, obj):
        return f'{obj.pacient.nume} {obj.pacient.prenume}'

    def get_medic_nume(self, obj):
        return f'{obj.medic.last_name} {obj.medic.first_name}'

    class Meta:
        model = Trimitere
        fields = '__all__'
        read_only_fields = ['numar_trimitere', 'data_emiterii']