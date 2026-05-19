import random
import string

from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail

from .models import CustomUser, Pacient, Programare, Consultatie, Reteta, ModuleUtilizator, LogActivitate
from .serializers import (UserSerializer, ProfilMedicSerializer, SchimbareParolaSerializer,
                          ModuleUtilizatorSerializer)
from .views_utils import log_actiune


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
        parola_noua = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        user.set_password(parola_noua)
        user.save()
        try:
            send_mail(
                subject='Resetare parolă — Cabinet Medical',
                message=(
                    f'Bună ziua, {user.first_name}!\n\n'
                    f'Parola dumneavoastră a fost resetată.\n'
                    f'Parolă temporară: {parola_noua}\n\n'
                    f'Vă recomandăm să o schimbați după autentificare.\n\n'
                    f'Cu stimă,\nCabinet Medical'
                ),
                from_email=None,
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception:
            pass
        return Response({'ok': True})


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
        from datetime import date

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
            send_mail(
                subject='Cont aprobat — Cabinet Medical',
                message=(
                    f'Bună ziua, {user.first_name}!\n\n'
                    f'Contul dumneavoastră a fost aprobat. '
                    f'Vă puteți loga la https://med487.pages.dev/app\n\n'
                    f'Cu stimă,\nCabinet Medical'
                ),
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def loguri_activitate(request):
    from zoneinfo import ZoneInfo
    tz_ro = ZoneInfo('Europe/Bucharest')
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
        'timestamp': l.timestamp.astimezone(tz_ro).strftime('%d.%m.%Y %H:%M:%S'),
    } for l in loguri]
    return Response(data)
