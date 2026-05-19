import xml.etree.ElementTree as ET

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse

from .models import ConfiguratieCabinet, Pacient, ConcediuMedical
from .views_utils import log_actiune


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_xml_raportare(request):
    luna = request.GET.get('luna')
    an = request.GET.get('an')

    if not luna or not an:
        return HttpResponse('Parametrii luna si an sunt obligatorii.', status=400)

    luna = int(luna)
    an = int(an)

    config = ConfiguratieCabinet.get()
    medic = request.user

    root = ET.Element('report')
    root.set('xmlns', 'http://www.cnas.ro/siui/2.0')

    physician = ET.SubElement(root, 'physician')
    physician.set('stencil', medic.parafa or '')
    physician.set('contractNo', config.nr_contract_cas or '')

    capita = ET.SubElement(physician, 'capita')
    pacienti = Pacient.objects.filter(medic=medic)

    for p in pacienti:
        enlisted = ET.SubElement(capita, 'enlisted')
        enlisted.set('AppID', str(p.id))
        enlisted.set('pid', p.cnp)
        enlisted.set('firstName', p.prenume)
        enlisted.set('lastName', p.nume)
        enlisted.set('birthDate', p.data_nastere.strftime('%Y-%m-%d'))
        enlisted.set('gender', '1' if p.sex == 'M' else '2')

        operations = ET.SubElement(enlisted, 'operations')
        op = ET.SubElement(operations, 'operation')
        op.set('AppID', f'OP-{p.id}')
        op.set('moveType', '1')
        op.set('date', p.data_inregistrare.strftime('%Y-%m-%d'))
        op.set('event', '1')

    concedii = ConcediuMedical.objects.filter(medic=medic, luna=luna, an=an)

    if concedii.exists():
        medicalNotes = ET.SubElement(physician, 'medicalNotes')
        for c in concedii:
            note = ET.SubElement(medicalNotes, 'medicalNote')
            note.set('AppID', str(c.id))
            note.set('stencilNo', medic.parafa or '')
            note.set('cid', c.pacient.cnp)
            note.set('serialCode', c.serie_numar[:4] if len(c.serie_numar) >= 4 else c.serie_numar)
            note.set('serialNo', c.serie_numar[4:] if len(c.serie_numar) > 4 else '')
            note.set('issueDate', c.data_acordarii.strftime('%Y-%m-%d'))
            note.set('ticketType', c.cod_indemnizatie)
            if c.cod_diagnostic:
                note.set('diagnostic', c.cod_diagnostic)

    tree = ET.ElementTree(root)
    ET.indent(tree, space='  ')

    log_actiune(request, 'export_xml', f'Anexa 006 — {luna:02d}/{an}')

    filename = f'raportare_MF_{an}_{luna:02d}.xml'
    response = HttpResponse(content_type='application/xml')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    ET.ElementTree(root).write(response, encoding='unicode', xml_declaration=True)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_xml_concedii(request):
    luna = request.GET.get('luna')
    an = request.GET.get('an')

    if not luna or not an:
        return HttpResponse('Parametrii luna si an sunt obligatorii.', status=400)

    luna = int(luna)
    an = int(an)

    config = ConfiguratieCabinet.get()
    medic = request.user

    concedii = ConcediuMedical.objects.filter(
        medic=medic, luna=luna, an=an
    ).select_related('pacient')

    root = ET.Element('report')
    root.set('xmlns', 'http://www.cnas.ro/siui/2.0')

    physician = ET.SubElement(root, 'physician')
    physician.set('stencil', medic.parafa or '')
    physician.set('contractNo', config.nr_contract_cas or '')

    medicalNotes = ET.SubElement(physician, 'medicalNotes')

    for c in concedii:
        note = ET.SubElement(medicalNotes, 'medicalNote')
        note.set('AppID', str(c.id))
        note.set('stencilNo', medic.parafa or '')
        note.set('cid', c.pacient.cnp)
        note.set('pid', c.pacient.cnp)
        note.set('firstName', c.pacient.prenume)
        note.set('lastName', c.pacient.nume)
        note.set('serialCode', c.serie_numar[:4] if len(c.serie_numar) >= 4 else c.serie_numar)
        note.set('serialNo', c.serie_numar[4:] if len(c.serie_numar) > 4 else '')
        note.set('issueDate', c.data_acordarii.strftime('%Y-%m-%d'))
        note.set('startDate', c.de_la.strftime('%Y-%m-%d') if c.de_la else '')
        note.set('endDate', c.pana_la.strftime('%Y-%m-%d') if c.pana_la else '')
        note.set('noOfDays', str(c.nr_zile))
        note.set('ticketType', c.cod_indemnizatie)
        note.set('emergeType', c.acut_subacut_cronic or 'acut')
        note.set('cardType', c.ambulator_internat or 'ambulator')
        if c.cod_diagnostic:
            note.set('diagnostic', c.cod_diagnostic)
        if c.tip == 'continuare' and c.serie_initial:
            note.set('initialSerialCode', c.serie_initial[:4] if len(c.serie_initial) >= 4 else c.serie_initial)
            note.set('initialSerialNo', c.serie_initial[4:] if len(c.serie_initial) > 4 else '')

    ET.indent(ET.ElementTree(root), space='  ')

    log_actiune(request, 'export_xml', f'Anexa 010 — {luna:02d}/{an}')

    filename = f'concedii_MF_{an}_{luna:02d}.xml'
    response = HttpResponse(content_type='application/xml')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    ET.ElementTree(root).write(response, encoding='unicode', xml_declaration=True)
    return response
