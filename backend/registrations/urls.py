"""
ITQAN — Registrations App URLs
مسارات تطبيق التسجيل
"""
from django.urls import path
from .views import (
    RegistrationCreateAPIView,
    RegistrationExportExcelAPIView,
    RegistrationStatsAPIView,
    CourseListAPIView,
)

urlpatterns = [
    path('registrations/', RegistrationCreateAPIView.as_view(), name='api-registration-create'),
    path('registrations/export-excel/', RegistrationExportExcelAPIView.as_view(), name='api-registration-export-excel'),
    path('registrations/stats/', RegistrationStatsAPIView.as_view(), name='api-registration-stats'),
    path('courses/', CourseListAPIView.as_view(), name='api-courses-list'),
]


