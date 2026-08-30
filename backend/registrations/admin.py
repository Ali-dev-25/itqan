"""
ITQAN — Registration Admin Panel
تخصيص لوحة إدارة طلبات التسجيل الإلكتروني مع زر وتصدير Excel مباشر
"""
import io
from django.contrib import admin
from django.utils.html import format_html
from django.http import HttpResponse
from django.urls import path
from django.shortcuts import redirect
from django.utils import timezone
from .models import Registration
from .utils import build_excel_workbook_from_queryset, export_registration_to_excel
from pathlib import Path
from django.conf import settings


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    # استخدام قالب مخصص لإضافة زر التصدير في أعلى اللائحة
    change_list_template = "admin/registrations_change_list.html"

    list_display = (
        'reference_number',
        'full_name_ar',
        'phone',
        'course_title',
        'status_badge',
        'receipt_preview',
        'created_at'
    )
    list_filter = ('status', 'course_id', 'created_at')
    search_fields = ('reference_number', 'full_name_ar', 'full_name_en', 'phone', 'course_title')
    readonly_fields = ('reference_number', 'created_at', 'updated_at', 'receipt_preview_large')
    list_per_page = 25
    date_hierarchy = 'created_at'

    fieldsets = (
        ('بيانات الطلب الرئيسية', {
            'fields': ('reference_number', 'status', 'created_at', 'updated_at')
        }),
        ('بيانات الطالب الشخصية', {
            'fields': ('full_name_ar', 'full_name_en', 'phone', 'birth_date', 'birth_place')
        }),
        ('الدورة التدريبية', {
            'fields': ('course_id', 'course_title')
        }),
        ('سند السداد والتحويل', {
            'fields': ('receipt_file', 'receipt_preview_large')
        }),
    )

    actions = ['export_selected_to_excel', 'mark_as_approved', 'mark_as_rejected']

    def get_urls(self):
        """إضافة مسار مخصص لتصدير كافة الطلاب بنقرة واحدة"""
        urls = super().get_urls()
        custom_urls = [
            path('export-all-excel/', self.admin_site.admin_view(self.export_all_excel_view), name='registrations-export-all-excel'),
        ]
        return custom_urls + urls

    def export_all_excel_view(self, request):
        """عرض لتنزيل ملف Excel لكافة الطلاب المسجلين فوراً"""
        queryset = Registration.objects.all().order_by('-created_at')
        wb = build_excel_workbook_from_queryset(queryset)
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"itqan_students_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @admin.display(description='حالة الطلب')
    def status_badge(self, obj):
        colors = {
            'pending': '#F59E0B',   # أصفر / برتقالي
            'approved': '#10B981',  # أخضر
            'rejected': '#EF4444',  # أحمر
        }
        status_titles = {
            'pending': 'قيد المراجعة',
            'approved': 'مقبول',
            'rejected': 'مرفوض',
        }
        color = colors.get(obj.status, '#6B7280')
        title = status_titles.get(obj.status, obj.status)
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{}</span>',
            color,
            title
        )

    @admin.display(description='معاينة السند')
    def receipt_preview(self, obj):
        if obj.receipt_file:
            file_url = obj.receipt_file.url
            if file_url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return format_html(
                    '<a href="{}" target="_blank"><img src="{}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px; border: 1px solid #CBD5E1;" /></a>',
                    file_url, file_url
                )
            elif file_url.lower().endswith('.pdf'):
                return format_html(
                    '<a href="{}" target="_blank" style="color: #EF4444; font-weight: bold; text-decoration: none;">📄 عرض PDF</a>',
                    file_url
                )
        return "لا يوجد سند"

    @admin.display(description='معاينة السند بحجم كامل')
    def receipt_preview_large(self, obj):
        if obj.receipt_file:
            file_url = obj.receipt_file.url
            if file_url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return format_html(
                    '<div style="margin-top: 10px;"><a href="{}" target="_blank"><img src="{}" style="max-width: 400px; max-height: 400px; border-radius: 8px; border: 2px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);" /></a><p style="color: #64748B; font-size: 12px; margin-top: 5px;">انقر على الصورة لفتحها بالحجم الكامل</p></div>',
                    file_url, file_url
                )
            elif file_url.lower().endswith('.pdf'):
                return format_html(
                    '<div style="margin-top: 10px;"><a href="{}" target="_blank" class="button" style="background-color: #EF4444; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none;">فتح ملف السند PDF</a></div>',
                    file_url
                )
        return "لا يوجد ملف مرفق"

    @admin.action(description='📊 تصدير الطلبات المحددة إلى ملف Excel')
    def export_selected_to_excel(self, request, queryset):
        wb = build_excel_workbook_from_queryset(queryset)
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"itqan_selected_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @admin.action(description='✅ تغيير حالة الطلبات المحددة إلى "مقبول"')
    def mark_as_approved(self, request, queryset):
        count = queryset.update(status='approved')
        self.message_user(request, f'تم قبول {count} طلب تسجيل بنجاح.')

    @admin.action(description='❌ تغيير حالة الطلبات المحددة إلى "مرفوض"')
    def mark_as_rejected(self, request, queryset):
        count = queryset.update(status='rejected')
        self.message_user(request, f'تم تحويل {count} طلب إلى مرفوض.')
