from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Max, Q
import boto3
import os
import uuid

from .models import Pacient, Consultatie, Diagnostic, Programare, DocumentPacient
from .serializers import PacientSerializer, ConsulatieSerializer, DiagnosticSerializer
from .views_utils import log_actiune


class PacientViewSet(viewsets.ModelViewSet):
    serializer_class = PacientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Pacient.objects.annotate(ultima_consultatie=Max('consultatii__data_ora'))
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

    from rest_framework.decorators import action

    @action(detail=True, methods=['get'])
    def consultatii(self, request, pk=None):
        pacient = self.get_object()
        serializer = ConsulatieSerializer(pacient.consultatii.all(), many=True)
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
        GRUP_VALID = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', '0+', '0-']
        STATUS_VALID = ['activ', 'decedat', 'transferat', 'inactiv']

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
                if s in [1, 2]: an_n = 1900 + an2
                elif s in [3, 4]: an_n = 1800 + an2
                elif s in [5, 6]: an_n = 2000 + an2
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
    try:
        pacient = Pacient.objects.get(pk=pacient_id)
    except Pacient.DoesNotExist:
        return Response({'eroare': 'Pacient negăsit.'}, status=404)

    if request.method == 'GET':
        docs = DocumentPacient.objects.filter(pacient=pacient)
        return Response([{
            'id': d.id, 'nume': d.nume, 'fisier_url': d.fisier_url,
            'marime': d.marime, 'incarcat_la': d.incarcat_la,
            'incarcat_de': d.incarcat_de.get_full_name() if d.incarcat_de else '—',
            'categorie': d.categorie,
        } for d in docs])

    fisier = request.FILES.get('fisier')
    nume = request.data.get('nume', fisier.name if fisier else 'Document')
    categorie = request.data.get('categorie', 'document')
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
        s3.upload_fileobj(fisier, os.environ['R2_BUCKET_NAME'], key,
                          ExtraArgs={'ContentType': fisier.content_type})
        url = f"{os.environ['R2_PUBLIC_URL']}/{key}"
        doc = DocumentPacient.objects.create(
            pacient=pacient, nume=nume, fisier_url=url, fisier_key=key,
            marime=fisier.size, incarcat_de=request.user, categorie=categorie,
        )
        log_actiune(request, 'upload_document', f'{doc.nume} — pacient ID {pacient_id}')
        return Response({
            'id': doc.id, 'nume': doc.nume, 'fisier_url': doc.fisier_url,
            'marime': doc.marime, 'incarcat_la': doc.incarcat_la,
        }, status=201)
    except Exception as e:
        return Response({'eroare': f'Eroare upload: {str(e)}'}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def sterge_document(request, doc_id):
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
