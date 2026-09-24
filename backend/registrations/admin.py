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
    # استخدام قالب مخصص لإضافة أزرار التصدير وقائمة الدورات في أعلى اللائحة
    change_list_template = "admin/registrations_change_list.html"

    list_display = (
        'reference_number',
        'full_name_ar',
        'phone',
        'course_title',
        'is_exported_badge',
        'attendance_badge',
        'residence_badge',
        'status_badge',
        'receipt_preview',
        'created_at'
    )
    list_filter = ('is_exported', 'status', 'attendance_mode', 'residence_location', 'course_id', 'created_at')
    search_fields = ('reference_number', 'full_name_ar', 'full_name_en', 'phone', 'course_title', 'export_batch')
    readonly_fields = ('reference_number', 'created_at', 'updated_at', 'receipt_preview_large', 'exported_at')
    list_per_page = 25
    date_hierarchy = 'created_at'

    fieldsets = (
        ('بيانات الطلب الرئيسية', {
            'fields': ('reference_number', 'status', 'created_at', 'updated_at')
        }),
        ('بيانات الأرشفة والتصدير إلى Excel (تصفير العداد)', {
            'fields': ('is_exported', 'exported_at', 'export_batch'),
            'description': 'عند تصدير الدفعة، يتم تفعيل "تم التصدير" وتاريخ التصدير، مما يصفر عداد المقاعد النشط في الموقع لتلك الدورة.'
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

    actions = [
        'export_and_archive_selected_to_excel',
        'export_selected_to_excel',
        'unarchive_selected',
        'mark_as_approved',
        'mark_as_rejected',
    ]

    def changelist_view(self, request, extra_context=None):
        """تزويد القالب بقائمة الدورات المعتمدة لتصدير كل دورة منفصلة"""
        extra_context = extra_context or {}
        courses_list = list(Course.objects.filter(status='active').order_by('sort_order', 'id'))
        
        # إضافة مستويات TechLingo الإضافية للتصدير المستقل لكل مستوى
        extra_levels = [
            {'course_id': 'C008_TECHLINGO_1A', 'title': 'دبلوم TechLingo - المستوى 1A'},
            {'course_id': 'C008_TECHLINGO_1B', 'title': 'دبلوم TechLingo - المستوى 1B'},
            {'course_id': 'C008_TECHLINGO_2A', 'title': 'دبلوم TechLingo - المستوى 2A'},
            {'course_id': 'C008_TECHLINGO_2B', 'title': 'دبلوم TechLingo - المستوى 2B'},
            {'course_id': 'C008_TECHLINGO_3A', 'title': 'دبلوم TechLingo - المستوى 3A'},
            {'course_id': 'C008_TECHLINGO_3B', 'title': 'دبلوم TechLingo - المستوى 3B'},
        ]
        
        extra_context['available_courses'] = courses_list
        extra_context['techlingo_levels'] = extra_levels
        return super().changelist_view(request, extra_context=extra_context)

    def get_urls(self):
        """إضافة مسارات مخصصة لتصدير كافة الطلاب أو تصدير دورة معينة وتصفير عدادها"""
        urls = super().get_urls()
        custom_urls = [
            path('export-all-excel/', self.admin_site.admin_view(self.export_all_excel_view), name='registrations-export-all-excel'),
            path('export-course-excel/<str:course_id>/', self.admin_site.admin_view(self.export_course_excel_view), name='registrations-export-course-excel'),
        ]
        return custom_urls + urls

    def export_all_excel_view(self, request):
        """تنزيل ملف Excel لكافة الطلاب المسجلين"""
        queryset = Registration.objects.all().order_by('-created_at')
        wb = build_excel_workbook_from_queryset(queryset, course_title="كافة الدورات", batch_name="السجل العام الشامل")
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"itqan_all_students_{timezone.now().strftime('%Y%m%d_%H%M')}.xlsx"
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    def export_course_excel_view(self, request, course_id):
        """
        تصدير الطلاب المقبولين في دورة معينة إلى ملف Excel مستقل مخصص
        مع أرشفة الطلاب المصدّرين وتصفير عداد المقاعد لتلك الدورة فوراً في الموقع (إرجاع الخط لـ 0)
        """
        from django.db import models as db_models
        cid_clean = (course_id or '').strip()
        
        # استعلام مخصص لـ TechLingo بحسب المستوى أو المعرف العام
        if cid_clean.startswith('C008_TECHLINGO_'):
            lvl = cid_clean.replace('C008_TECHLINGO_', '').strip()
            course_filter = (
                db_models.Q(course_id__iexact=cid_clean) |
                db_models.Q(course_title__icontains=f"المستوى {lvl}") |
                db_models.Q(course_title__icontains=f"Level {lvl}")
            )
        else:
            course_filter = db_models.Q(course_id__iexact=cid_clean)

        # 1. جلب كافة الطلاب غير المصدّرين حالياً لهذه الدورة
        queryset = Registration.objects.filter(course_filter, is_exported=False).order_by('created_at')

        # وإذا تم تصدير الجميع مسبقاً، نصدّر الدفعة الكاملة للاطلاع
        if not queryset.exists():
            queryset = Registration.objects.filter(course_filter).order_by('-created_at')

        # اسم الدورة
        course_obj = Course.objects.filter(course_id=cid_clean).first()
        if course_obj:
            course_title = course_obj.title
        elif queryset.exists():
            course_title = queryset.first().course_title
        else:
            course_title = cid_clean

        now_dt = timezone.now()
        batch_name = f"دفعة {now_dt.strftime('%Y-%m-%d')} ({course_title[:25]})"

        # توليد ملف Excel مخصص بالكامل لهذه الدورة
        wb = build_excel_workbook_from_queryset(queryset, course_title=course_title, batch_name=batch_name)

        # أرشفة الطلاب وتصفير العداد فوراً بالواجهة
        queryset.filter(is_exported=False).update(
            is_exported=True,
            exported_at=now_dt,
            export_batch=batch_name
        )

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"itqan_{cid_clean}_{now_dt.strftime('%Y%m%d_%H%M')}.xlsx"
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @admin.display(description='حالة العداد والأرشفة')
    def is_exported_badge(self, obj):
        if obj.is_exported:
            batch_text = obj.export_batch or 'مؤرشف'
            return format_html(
                '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;" title="تم التصدير: {}">📦 مؤرشف (مصدّر)</span>',
                '#64748B',
                batch_text
            )
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 11px;">{}</span>',
            '#059669',
            '⚡ نشط في العداد'
        )

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

    @admin.action(description='📦 تصدير الطلبات المحددة وأرشفتها (تصفير العداد في الموقع)')
    def export_and_archive_selected_to_excel(self, request, queryset):
        now_dt = timezone.now()
        batch_name = f"دفعة تصدير يدوي {now_dt.strftime('%Y-%m-%d %H:%M')}"
        
        # توليد الملف
        wb = build_excel_workbook_from_queryset(queryset, course_title="طلبات محددة", batch_name=batch_name)
        
        # أرشفة السجلات وتصفير عدادها
        count = queryset.update(
            is_exported=True,
            exported_at=now_dt,
            export_batch=batch_name
        )
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)

        filename = f"itqan_archived_{now_dt.strftime('%Y%m%d_%H%M')}.xlsx"
        response = HttpResponse(
            output.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @admin.action(description='📊 تصدير الطلبات المحددة إلى Excel (بدون تصفير العداد)')
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

    @admin.action(description='🔄 إعادة الطلبات المحددة إلى العداد النشط (إلغاء الأرشفة)')
    def unarchive_selected(self, request, queryset):
        count = queryset.update(is_exported=False, exported_at=None, export_batch=None)
        self.message_user(request, f'تمت إعادة {count} طالب إلى العداد النشط في الموقع بنجاح.')

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
        'export_action_link',
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

    @admin.display(description='المقبولون النشطون (في عداد الموقع)')
    def enrolled_count_display(self, obj):
        regs = Registration.objects.filter(course_id=obj.course_id, status='approved', is_exported=False)
        in_p = regs.filter(attendance_mode='in_person').count()
        on_l = regs.filter(attendance_mode='online').count()
        total = in_p + on_l
        archived = Registration.objects.filter(course_id=obj.course_id, status='approved', is_exported=True).count()
        archived_info = f' | مؤرشف: {archived}' if archived > 0 else ''
        return format_html(
            '<span title="النشطون بالعداد: {} (حضوري: {} | عن بعد: {}){}"><strong>{}</strong> طالب <small style="color: #64748B;">({}ح / {}ع)</small></span>',
            total, in_p, on_l, archived_info, total, in_p, on_l
        )

    @admin.display(description='تصدير الدورة إلى Excel')
    def export_action_link(self, obj):
        url = f"/admin/registrations/registration/export-course-excel/{obj.course_id}/"
        return format_html(
            '<a href="{}" class="button" style="background-color: #0284C7; color: white; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="تصدير طلاب هذه الدورة فقط إلى Excel وتصفير عدادها في الموقع">'
            '<span>📊 تصدير وتصفير</span></a>',
            url
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

