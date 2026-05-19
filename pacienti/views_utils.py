from .models import LogActivitate

LUNI_RO = [
    '', 'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'
]


def log_actiune(request, actiune, descriere=''):
    try:
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')
        LogActivitate.objects.create(
            user=request.user if request.user.is_authenticated else None,
            actiune=actiune,
            descriere=descriere,
            ip=ip or None,
        )
    except Exception:
        pass
