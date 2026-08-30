"""
ITQAN Backend — URL Configuration
توجيه المسارات للـ API ولوحة الإدارة والملفات المرفوعة وواجهات الـ Frontend
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from pathlib import Path

urlpatterns = [
    # 1. لوحة الإدارة
    path('admin/', admin.site.urls),

    # 2. نقاط النهاية للـ API
    path('api/v1/', include('registrations.urls')),

    # 3. توجيه صفحات الـ Frontend المباشرة
    re_path(r'^(?:index\.html)?$', serve, {'document_root': settings.FRONTEND_DIR, 'path': 'index.html'}),
    re_path(r'^register\.html$', serve, {'document_root': settings.FRONTEND_DIR, 'path': 'register.html'}),
    re_path(r'^fatin\.html$', serve, {'document_root': settings.FRONTEND_DIR, 'path': 'fatin.html'}),
    re_path(r'^fatin_voice_test\.html$', serve, {'document_root': settings.FRONTEND_DIR, 'path': 'fatin_voice_test.html'}),
]

# تقديم ملفات الـ Media (سندات الدفع) أثناء التطوير
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # تقديم مجلد assets كملفات ثابتة
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': settings.FRONTEND_DIR / 'assets'}),
    ]

# تخصيص عناوين لوحة الإدارة
admin.site.site_header = "إدارة منصة «إتقان» التعليمية"
admin.site.site_title = "بوابة إدارة إتقان"
admin.site.index_title = "لوحة التحكم والطلبات"
