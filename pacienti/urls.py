from rest_framework.routers import DefaultRouter
from .views import PacientViewSet, ConsulatieViewSet, DiagnosticViewSet, UserViewSet, ProgramareViewSet

router = DefaultRouter()
router.register('pacienti', PacientViewSet)
router.register('consultatii', ConsulatieViewSet)
router.register('diagnostice', DiagnosticViewSet)
router.register('useri', UserViewSet)
router.register('programari', ProgramareViewSet)

urlpatterns = router.urls