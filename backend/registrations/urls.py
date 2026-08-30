"""
ITQAN — Registrations App URLs
مسارات تطبيق التسجيل
"""
from django.urls import path
from .views import RegistrationCreateAPIView, RegistrationExportExcelAPIView

urlpatterns = [
    path('registrations/', RegistrationCreateAPIView.as_view(), name='api-registration-create'),
    path('registrations/export-excel/', RegistrationExportExcelAPIView.as_view(), name='api-registration-export-excel'),
]
