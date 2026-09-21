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
from .models import Registration, Course
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
        'attendance_badge',
        'residence_badge',
        'status_badge',
        'receipt_preview',
        'created_at'
    )
    list_filter = ('status', 'attendance_mode', 'residence_location', 'course_id', 'created_at')
    search_fields = ('reference_number', 'full_name_ar', 'full_name_en', 'phone', 'course_title')
    readonly_fields = ('reference_number', 'created_at', 'updated_at', 'receipt_preview_large')
    list_per_page = 25
    date_hierarchy = 'created_at'

    fieldsets = (
        ('بيانات الطلب الرئيسية', {
            'fields': ('reference_number', 'status', 'created_at', 'updated_at')
        }),
        ('بيانات الطالب الشخصية', {
            'fields': ('full_name_ar', 'full_name_en', 'phone', 'residence_location', 'attendance_mode', 'birth_date', 'birth_place')
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

    @admin.display(description='نمط الحضور')
    def attendance_badge(self, obj):
        is_in_person = (obj.attendance_mode == 'in_person')
        bg = '#3B82F6' if is_in_person else '#8B5CF6'
        title = '🏫 حضوري' if is_in_person else '🌐 عن بعد'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">{}</span>',
            bg,
            title
        )

    @admin.display(description='موقع الإقامة')
    def residence_badge(self, obj):
        is_inside = (obj.residence_location == 'inside_yemen')
        bg = '#059669' if is_inside else '#D97706'
        title = '🇾🇪 داخل الوطن' if is_inside else '🌍 خارج الوطن'
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">{}</span>',
            bg,
            title
        )

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


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        'course_id',
        'title',
        'track_key',
        'status_badge',
        'in_person_badge',
        'online_badge',
        'enrolled_count_display',
        'sort_order'
    )
    list_editable = ('sort_order',)
    list_filter = ('status', 'allow_in_person', 'allow_online', 'track_key')
    search_fields = ('course_id', 'title', 'description', 'track')
    ordering = ('sort_order', 'id')
    list_per_page = 20

    fieldsets = (
        ('المعلومات الأساسية للدورة', {
            'fields': ('course_id', 'title', 'track', 'track_key', 'description')
        }),
        ('حالة التفعيل ونمطي الحضور (حضوري / Online)', {
            'description': 'يمكنك إيقاف الدورة مؤقتاً لتظهر مبهتة في الموقع، أو حصر التدريب على الحضوري فقط أو الأونلاين فقط.',
            'fields': ('status', 'allow_in_person', 'allow_online')
        }),
        ('التوقيت والمستوى والشارة', {
            'fields': ('duration', 'level', 'badge', 'prerequisite', 'laptop_required')
        }),
        ('الهوية البصرية والألوان (Lucide Icons)', {
            'fields': ('icon', 'color', 'bg_color', 'featured', 'sort_order')
        }),
        ('الطاقة الاستيعابية للمقاعد', {
            'fields': ('min_students', 'max_students')
        }),
        ('الرسوم والتسعيرة', {
            'fields': (
                ('price_in_person_current', 'price_in_person_original'),
                ('price_online_current', 'price_online_original'),
                'price_certificate'
            )
        }),
        ('محاور ومفردات الدورة', {
            'fields': ('topics',),
            'description': 'أدخل كل محور تدريبي في سطر منفصل ليظهر كقائمة منسدلة أنيقة في بطاقة الدورة.'
        }),
    )

    actions = [
        'make_suspended',
        'make_active',
        'set_in_person_only',
        'set_online_only',
        'set_both_modes'
    ]

    @admin.display(description='حالة الدورة')
    def status_badge(self, obj):
        if obj.status == 'active':
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 9px; border-radius: 6px; font-weight: bold; font-size: 11px;">{}</span>',
                '#10B981',
                '🟢 نشطة ومتاحة'
            )
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 9px; border-radius: 6px; font-weight: bold; font-size: 11px;">{}</span>',
            '#EF4444',
            '⏸️ موقوفة حالياً'
        )

    @admin.display(description='حضوري بالمقر')
    def in_person_badge(self, obj):
        if obj.allow_in_person:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 600;">{}</span>',
                '#2563EB',
                '✓ متاح'
            )
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 7px; border-radius: 5px; font-size: 11px;">{}</span>',
            '#94A3B8',
            '✗ معطل'
        )

    @admin.display(description='عن بعد Online')
    def online_badge(self, obj):
        if obj.allow_online:
            return format_html(
                '<span style="background-color: {}; color: white; padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 600;">{}</span>',
                '#7C3AED',
                '✓ متاح'
            )
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 7px; border-radius: 5px; font-size: 11px;">{}</span>',
            '#94A3B8',
            '✗ معطل'
        )

    @admin.display(description='المقبولون (حضوري / عن بعد)')
    def enrolled_count_display(self, obj):
        regs = Registration.objects.filter(course_id=obj.course_id, status='approved')
        in_p = regs.filter(attendance_mode='in_person').count()
        on_l = regs.filter(attendance_mode='online').count()
        total = in_p + on_l
        return format_html(
            '<span title="المجموع: {} (حضوري: {} | عن بعد: {})"><strong>{}</strong> طالب <small style="color: #64748B;">({}ح / {}ع)</small></span>',
            total, in_p, on_l, total, in_p, on_l
        )

    @admin.action(description='⏸️ إيقاف / تعطيل الدورات المحددة مؤقتاً')
    def make_suspended(self, request, queryset):
        count = queryset.update(status='suspended')
        self.message_user(request, f'تم إيقاف {count} دورة تدريبية بنجاح، وستظهر مبهتة في الموقع.')

    @admin.action(description='🟢 تفعيل واستئناف التسجيل للدورات المحددة')
    def make_active(self, request, queryset):
        count = queryset.update(status='active')
        self.message_user(request, f'تم تفعيل {count} دورة تدريبية بنجاح.')

    @admin.action(description='🏫 قصر التدريب على "الحضوري بالمقر فقط" (تعطيل Online)')
    def set_in_person_only(self, request, queryset):
        count = queryset.update(allow_in_person=True, allow_online=False)
        self.message_user(request, f'تم حصر التدريب على الحضوري فقط لـ {count} دورة.')

    @admin.action(description='🌐 قصر التدريب على "عن بعد Online فقط" (تعطيل الحضوري)')
    def set_online_only(self, request, queryset):
        count = queryset.update(allow_in_person=False, allow_online=True)
        self.message_user(request, f'تم حصر التدريب على عن بعد Online فقط لـ {count} دورة.')

    @admin.action(description='🔄 إتاحة كلا النمطين (حضوري + Online)')
    def set_both_modes(self, request, queryset):
        count = queryset.update(allow_in_person=True, allow_online=True)
        self.message_user(request, f'تم تفعيل الحضور الحضوري والأونلاين معاً لـ {count} دورة.')

