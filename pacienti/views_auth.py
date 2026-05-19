from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings


def _set_token_cookies(response, access, refresh=None):
    opts = {
        'httponly': True,
        'secure': not settings.DEBUG,
        'samesite': 'None' if not settings.DEBUG else 'Lax',
        'path': '/',
    }
    response.set_cookie('access', access, max_age=8 * 3600, **opts)
    if refresh is not None:
        response.set_cookie('refresh', refresh, max_age=7 * 24 * 3600, **opts)


class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            _set_token_cookies(response, response.data['access'], response.data['refresh'])
            response.data = {}
        return response


class CookieTokenRefreshView(APIView):
    permission_classes = []

    def post(self, request):
        raw = request.COOKIES.get('refresh')
        if not raw:
            return Response({'detail': 'No refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            token = JWTRefreshToken(raw)
            access = str(token.access_token)
        except Exception:
            return Response({'detail': 'Invalid or expired refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)
        response = Response({})
        _set_token_cookies(response, access)
        return response


class LogoutView(APIView):
    permission_classes = []

    def post(self, request):
        response = Response({})
        response.delete_cookie('access', path='/')
        response.delete_cookie('refresh', path='/')
        return response
