from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (LinieRetetaViewSet, PacientViewSet, ConsulatieViewSet,
                    DiagnosticViewSet, ResetParolaView, RetetaViewSet, UserViewSet,
                    ProgramareViewSet, ConfiguratieCabinetViewSet,
                    ConcediuMedicalViewSet, TrimitereViewSet,
                    ModuleUtilizatorViewSet)
from .views import print_concediu, print_reteta, print_trimitere
from .views import ProfilMedicView, SchimbareParolaView, zile_libere_view
from .views import VerificareCNPView, InregistrarePacientView, AprobarePacientView
from .views import PortalPacientView
from .views import export_xml_raportare, export_xml_concedii
from .views import import_pacienti_excel
from .views import documente_pacient, sterge_document
from .views import loguri_activitate

router = DefaultRouter()
router.register('pacienti', PacientViewSet, basename='pacient')
router.register('consultatii', ConsulatieViewSet, basename='consultatie')
router.register('diagnostice', DiagnosticViewSet, basename='diagnostic')
router.register('useri', UserViewSet, basename='user')
router.register('programari', ProgramareViewSet, basename='programare')
router.register(r'configuratie', ConfiguratieCabinetViewSet, basename='configuratie')
router.register(r'retete', RetetaViewSet, basename='retete')
router.register(r'linii-reteta', LinieRetetaViewSet, basename='linii-reteta')
router.register(r'concedii', ConcediuMedicalViewSet, basename='concediu')
router.register(r'trimiteri', TrimitereViewSet, basename='trimitere')

urlpatterns = router.urls + [
    path('concedii/<int:pk>/print/', print_concediu, name='print-concediu'),
    path('retete/<int:pk>/print/', print_reteta, name='print-reteta'),
    path('trimiteri/<int:pk>/print/', print_trimitere, name='print-trimitere'),
    path('profil/', ProfilMedicView.as_view(), name='profil-medic'),
    path('profil/schimbare-parola/', SchimbareParolaView.as_view(), name='schimbare-parola'),
    path('module/<int:pk>/', ModuleUtilizatorViewSet.as_view({'get': 'retrieve', 'put': 'update'}), name='module-utilizator'),
    path('zile-libere/', zile_libere_view, name='zile_libere'),
    path('inregistrare/verifica-cnp/', VerificareCNPView.as_view()),
    path('inregistrare/', InregistrarePacientView.as_view()),
    path('cereri/<int:pk>/aprobare/', AprobarePacientView.as_view()),
    path('portal-pacient/', PortalPacientView.as_view()),
    path('reset-parola/', ResetParolaView.as_view()),
    path('export-xml/', export_xml_raportare),
    path('export-xml-concedii/', export_xml_concedii),
    path('import-pacienti/', import_pacienti_excel),
    path('pacienti/<int:pacient_id>/documente/', documente_pacient),
    path('documente/<int:doc_id>/', sterge_document),
    path('loguri/', loguri_activitate),
]

