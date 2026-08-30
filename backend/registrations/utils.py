"""
ITQAN — Registration Utilities
دوال مساعدة: توليد الرقم المرجعي + تصدير Excel
"""
import io
import random
from datetime import datetime
from pathlib import Path

from django.conf import settings
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side


def generate_reference_number():
    """
    توليد رقم مرجعي فريد لطلب التسجيل
    الصيغة: ITQ-{السنة}-{رقم عشوائي 4 أرقام}
    مثال: ITQ-2026-5821
    """
    from .models import Registration

    year = datetime.now().year
    while True:
        code = random.randint(1000, 9999)
        ref = f"ITQ-{year}-{code}"
        if not Registration.objects.filter(reference_number=ref).exists():
            return ref


def format_arabic_timestamp(dt=None):
    """
    تنسيق التاريخ والوقت بالعربي
    الخرج: "27 أغسطس 2026 - 11:35 م"
    """
    if dt is None:
        dt = datetime.now()

    # الأشهر بالعربي
    arabic_months = {
        1: 'يناير', 2: 'فبراير', 3: 'مارس', 4: 'أبريل',
        5: 'مايو', 6: 'يونيو', 7: 'يوليو', 8: 'أغسطس',
        9: 'سبتمبر', 10: 'أكتوبر', 11: 'نوفمبر', 12: 'ديسمبر'
    }

    month_name = arabic_months.get(dt.month, '')
    hour = dt.hour
    period = 'ص' if hour < 12 else 'م'
    if hour == 0:
        hour = 12
    elif hour > 12:
        hour -= 12

    return f"{dt.day} {month_name} {dt.year} - {hour:02d}:{dt.minute:02d} {period}"


def build_excel_workbook_from_queryset(queryset):
    """
    بناء ملف Excel كامل بتنسيق احترافي من مجموعة بيانات Registration
    """
    wb = Workbook()
    ws = wb.active
    ws.title = 'بيانات الطلاب المسجلين'
    ws.sheet_view.rightToLeft = True  # اتجاه الكتابة من اليمين لليسار (RTL)

    # عناوين الأعمدة
    headers = [
        '#',
        'الرقم المرجعي',
        'اسم الطالب (عربي)',
        'اسم الطالب (إنجليزي)',
        'رقم الجوال / الواتساب',
        'معرف الدورة',
        'اسم البرنامج / الدورة التدريبية',
        'تاريخ الميلاد',
        'مكان الميلاد',
        'حالة الطلب',
        'تاريخ ووقت التقديم',
        'ملف السند المرفوع',
    ]

    # تنسيق رأس الجدول
    header_font = Font(name='Arial', bold=True, size=11, color='FFFFFF')
    header_fill = PatternFill(start_color='1E3A8A', end_color='1E3A8A', fill_type='solid')  # كحلي أنيق
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1'),
    )

    ws.row_dimensions[1].height = 28

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    # عرض الأعمدة
    col_widths = [6, 18, 28, 25, 18, 14, 38, 15, 15, 14, 22, 35]
    for i, width in enumerate(col_widths, 1):
        col_letter = chr(64 + i)
        ws.column_dimensions[col_letter].width = width

    status_map = {
        'pending': 'قيد المراجعة ⏳',
        'approved': 'مقبول ✅',
        'rejected': 'مرفوض ❌',
    }

    data_font = Font(name='Arial', size=10)
    data_alignment = Alignment(horizontal='center', vertical='center')

    for idx, reg in enumerate(queryset, 1):
        birth_str = reg.birth_date.strftime('%Y-%m-%d') if reg.birth_date else '—'
        created_str = reg.created_at.strftime('%Y-%m-%d %H:%M') if reg.created_at else '—'
        file_name = reg.receipt_file.name if reg.receipt_file else 'لا يوجد ملف'

        row_data = [
            idx,
            reg.reference_number,
            reg.full_name_ar,
            reg.full_name_en or '—',
            reg.phone,
            reg.course_id,
            reg.course_title,
            birth_str,
            reg.birth_place or '—',
            status_map.get(reg.status, reg.status),
            created_str,
            file_name,
        ]

        row_num = idx + 1
        ws.row_dimensions[row_num].height = 22
        
        # تلوين متناوب للصفوف
        row_fill = PatternFill(
            start_color='F8FAFC' if idx % 2 == 0 else 'FFFFFF',
            end_color='F8FAFC' if idx % 2 == 0 else 'FFFFFF',
            fill_type='solid'
        )

        for col_idx, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_num, column=col_idx, value=value)
            cell.font = data_font
            cell.alignment = data_alignment
            cell.border = thin_border
            cell.fill = row_fill

    return wb


def export_registration_to_excel(registration=None):
    """
    تحديث ملف Excel الإداري المحفوظ على السيرفر
    """
    from .models import Registration
    excel_path = Path(settings.EXPORTS_DIR) / 'registrations.xlsx'
    
    queryset = Registration.objects.all().order_by('-created_at')
    wb = build_excel_workbook_from_queryset(queryset)
    wb.save(str(excel_path))
    return str(excel_path)
