from rest_framework.routers import DefaultRouter
from .views import PacientViewSet, ConsulatieViewSet, DiagnosticViewSet, UserViewSet

router = DefaultRouter()
router.register('pacienti', PacientViewSet)
router.register('consultatii', ConsulatieViewSet)
router.register('diagnostice', DiagnosticViewSet)
router.register('useri', UserViewSet)

urlpatterns = router.urls