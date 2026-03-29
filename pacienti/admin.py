from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Pacient, Diagnostic, Consultatie, DiagnosticConsultatie, Programare

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Rol', {'fields': ('rol',)}),
    )
    list_display = ['username', 'get_full_name', 'email', 'rol', 'is_active']

@admin.register(Pacient)
class PacientAdmin(admin.ModelAdmin):
    list_display = ['nume', 'prenume', 'cnp', 'data_nastere', 'sex', 'telefon']
    search_fields = ['nume', 'prenume', 'cnp']
    list_filter = ['sex', 'grup_sangvin']

@admin.register(Diagnostic)
class DiagnosticAdmin(admin.ModelAdmin):
    list_display = ['cod_icd10', 'denumire']
    search_fields = ['cod_icd10', 'denumire']

@admin.register(Consultatie)
class ConsulatieAdmin(admin.ModelAdmin):
    list_display = ['pacient', 'medic', 'data_ora']
    list_filter = ['medic']
    search_fields = ['pacient__nume', 'pacient__cnp']

@admin.register(DiagnosticConsultatie)
class DiagnosticConsulatieAdmin(admin.ModelAdmin):
    list_display = ['consultatie', 'diagnostic', 'tip']


@admin.register(Programare)
class ProgramareAdmin(admin.ModelAdmin):
    list_display = ['data_ora', 'nume_pacient', 'telefon_pacient', 'status', 'medic']
    list_filter = ['status', 'data_ora']
    search_fields = ['nume_pacient', 'telefon_pacient']