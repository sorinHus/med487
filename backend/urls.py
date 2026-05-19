from django.contrib import admin
from django.urls import path, include
from pacienti.views import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('pacienti.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path('api/token/', CookieTokenObtainPairView.as_view()),
    path('api/token/refresh/', CookieTokenRefreshView.as_view()),
    path('api/logout/', LogoutView.as_view()),
]


def ratelimited_error(request, exception):
    return JsonResponse({'eroare': 'Prea multe cereri. Încearcă din nou mai târziu.'}, status=429)

handler429 = ratelimited_error