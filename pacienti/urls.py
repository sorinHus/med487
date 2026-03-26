from rest_framework.routers import DefaultRouter
from .views import PacientViewSet, ConsulatieViewSet, DiagnosticViewSet, UserViewSet, ProgramareViewSet

router = DefaultRouter()
router.register('pacienti', PacientViewSet, basename='pacient')
router.register('consultatii', ConsulatieViewSet, basename='consultatie')
router.register('diagnostice', DiagnosticViewSet, basename='diagnostic')
router.register('useri', UserViewSet, basename='user')
router.register('programari', ProgramareViewSet, basename='programare')

urlpatterns = router.urls