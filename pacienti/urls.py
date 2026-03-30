from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (LinieRetetaViewSet, PacientViewSet, ConsulatieViewSet,
                    DiagnosticViewSet, RetetaViewSet, UserViewSet,
                    ProgramareViewSet, ConfiguratieCabinetViewSet,
                    ConcediuMedicalViewSet, TrimitereViewSet)
from .views import print_concediu, print_reteta, print_trimitere
from .views import test_email
from .views import ProfilMedicView, SchimbareParolaView

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
    path('test-email/', test_email, name='test-email'),
    path('profil/', ProfilMedicView.as_view(), name='profil-medic'),
    path('profil/schimbare-parola/', SchimbareParolaView.as_view(), name='schimbare-parola'),
]