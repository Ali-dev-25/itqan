"""
ITQAN — Registration Views
معالجة طلبات التسجيل الإلكتروني وإرجاع الردود بصيغة JSON القياسية
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Registration
from .serializers import RegistrationSerializer
from .utils import (
    generate_reference_number,
    format_arabic_timestamp,
    export_registration_to_excel,
)

logger = logging.getLogger(__name__)


class RegistrationCreateAPIView(APIView):
    """
    نقطة النهاية لاستقبال طلبات التسجيل الجديدة
    POST /api/v1/registrations/
    """
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        serializer = RegistrationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "success": False,
                "message": "يرجى التحقق من صحة البيانات المرفوعة",
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        try:
            # 1. توليد الرقم المرجعي الفريد
            ref_number = generate_reference_number()

            # 2. إنشاء وحفظ السجل في قاعدة البيانات
            registration = Registration.objects.create(
                reference_number=ref_number,
                full_name_ar=validated_data['fullNameAr'],
                full_name_en=validated_data.get('fullNameEn', ''),
                phone=validated_data['phone'],
                course_id=validated_data['courseId'],
                course_title=validated_data['courseTitle'],
                birth_date=validated_data.get('birthDate'),
                birth_place=validated_data.get('birthPlace', ''),
                receipt_file=validated_data['receiptFile'],
                status='pending'
            )

            # 3. تصدير/تحديث بيانات الطلب في ملف Excel إداري
            try:
                export_registration_to_excel(registration)
            except Exception as excel_err:
                logger.error(f"Error exporting to Excel: {excel_err}")

            # 4. إرسال التنبيهات (Notification Hook)
            self.send_notifications(registration)

            # 5. تجهيز تاريخ ووقت الإرسال المنسق بالعربي
            formatted_time = format_arabic_timestamp(registration.created_at)

            # 6. إرجاع استجابة JSON موحدة للـ Frontend
            return Response({
                "success": True,
                "reference": ref_number,
                "message": "تم استلام طلب التسجيل وسند السداد بنجاح",
                "timestamp": formatted_time,
                "data": {
                    "referenceNumber": ref_number,
                    "studentName": registration.full_name_ar,
                    "phone": registration.phone,
                    "courseId": registration.course_id,
                    "courseTitle": registration.course_title,
                    "submittedAt": formatted_time
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception("Unexpected error during registration submission:")
            return Response({
                "success": False,
                "message": "حدث خطأ أثناء معالجة الطلب في السيرفر. يرجى المحاولة مرة أخرى لاحقاً.",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def send_notifications(self, registration):
        """
        إرسال إشعار بوصول طلب تسجيل جديد (بريد إلكتروني / سجل نظام)
        """
        try:
            logger.info(
                f"🔔 إشعار طلب تسجيل جديد: {registration.reference_number} | "
                f"الطالب: {registration.full_name_ar} | "
                f"الدورة: {registration.course_title} | "
                f"الجوال: {registration.phone}"
            )
            # يمكن ربطه بخدمات WhatsApp API (مثل Twilio/UltraMsg) أو البريد عبر SendGrid/SMTP لاحقاً
        except Exception as e:
            logger.error(f"Notification failure: {e}")


class RegistrationExportExcelAPIView(APIView):
    """
    تنزيل ملف Excel لجميع الطلاب المسجلين عبر API مباشر
    GET /api/v1/registrations/export-excel/
    """
    def get(self, request, *args, **kwargs):
        import io
        from django.utils import timezone
        from django.http import HttpResponse
        from .utils import build_excel_workbook_from_queryset

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


class RegistrationStatsAPIView(APIView):
    """
    إرجاع عدد المسجلين المقبولين فقط من قبل الإدارة لكل دورة من قاعدة البيانات
    مع معالجة متقدمة لضمان التوافق ومنع أي تخزين مؤقت نهائياً
    GET /api/v1/registrations/stats/
    """
    def get(self, request, *args, **kwargs):
        from django.utils import timezone
        
        # القاموس المبدئي لجميع معرفات الدورات والمستويات المعتمدة
        stats = {
            'C001_CPP_BASICS': 0,
            'C002_CPP_OOP': 0,
            'C003_PYTHON_BASICS': 0,
            'C004_PYTHON_DESKTOP': 0,
            'C005_PYTHON_AI': 0,
            'C006_SQL': 0,
            'C007_AI_PROMPT': 0,
            'C008_TECHLINGO': 0,
            'C008_TECHLINGO_1A': 0,
            'C008_TECHLINGO_1B': 0,
            'C008_TECHLINGO_2A': 0,
            'C008_TECHLINGO_2B': 0,
            'C008_TECHLINGO_3A': 0,
            'C008_TECHLINGO_3B': 0,
            'C009_ICDL': 0,
        }
        
        # استعلام الطلبات المقبولة فقط (status='approved')
        approved_registrations = Registration.objects.filter(status='approved')
        
        for reg in approved_registrations:
            cid = (reg.course_id or '').strip()
            cid_upper = cid.upper()
            title = (reg.course_title or '').strip().lower()
            
            # 1. دبلوم ومستويات اللغة الإنجليزية TechLingo (فحص ذكي ومستقل أولاً لمنع أي تداخل)
            is_techlingo = (
                'TECHLINGO' in cid_upper or
                'c008' in cid.lower() or
                'techlingo' in title or
                'إنجليزية' in title or
                'انجليزية' in title or
                'انجليزي' in title or
                'إنجليزي' in title
            )
            if is_techlingo:
                stats['C008_TECHLINGO'] = stats.get('C008_TECHLINGO', 0) + 1
                matched_level = None
                for lvl in ['1A', '1B', '2A', '2B', '3A', '3B']:
                    if (
                        lvl in cid_upper or
                        f'المستوى {lvl.lower()}' in title or
                        f'level {lvl.lower()}' in title or
                        f' {lvl.lower()}' in title or
                        f'({lvl.lower()}' in title
                    ):
                        matched_level = f'C008_TECHLINGO_{lvl}'
                        break
                if matched_level:
                    stats[matched_level] = stats.get(matched_level, 0) + 1
                continue

            # 2. دورة C++ OOP
            is_cpp_oop = (
                'C002' in cid_upper or
                'CPP_OOP' in cid_upper or
                ('c++' in title and ('oop' in title or 'كائن' in title or 'كائنية' in title))
            )
            if is_cpp_oop:
                stats['C002_CPP_OOP'] = stats.get('C002_CPP_OOP', 0) + 1
                continue

            # 3. دورة أساسيات C++ (حصرية لـ C++ لمنع احتساب أي دورة أخرى تحتوي كلمة أساسيات)
            is_cpp_basics = (
                'C001' in cid_upper or
                'CPP_BASICS' in cid_upper or
                ('c++' in title and not ('oop' in title or 'كائن' in title or 'كائنية' in title))
            )
            if is_cpp_basics:
                stats['C001_CPP_BASICS'] = stats.get('C001_CPP_BASICS', 0) + 1
                continue

            # 4. بايثون - تطبيقات سطح المكتب والواجهات PyQt
            is_py_desktop = (
                'C004' in cid_upper or
                'DESKTOP' in cid_upper or
                ('بايثون' in title and ('مكتب' in title or 'واجهات' in title or 'pyqt' in title or 'gui' in title))
            )
            if is_py_desktop:
                stats['C004_PYTHON_DESKTOP'] = stats.get('C004_PYTHON_DESKTOP', 0) + 1
                continue

            # 5. بايثون - ذكاء اصطناعي وتحليل بيانات
            is_py_ai = (
                'C005' in cid_upper or
                ('PYTHON' in cid_upper and 'AI' in cid_upper) or
                ('بايثون' in title and ('ذكاء' in title or 'بيانات' in title or 'تعلم الآلة' in title or 'machine' in title))
            )
            if is_py_ai:
                stats['C005_PYTHON_AI'] = stats.get('C005_PYTHON_AI', 0) + 1
                continue

            # 6. أساسيات بايثون
            is_py_basics = (
                'C003' in cid_upper or
                'PYTHON_BASICS' in cid_upper or
                ('بايثون' in title and not ('مكتب' in title or 'واجهات' in title or 'ذكاء' in title or 'بيانات' in title))
            )
            if is_py_basics:
                stats['C003_PYTHON_BASICS'] = stats.get('C003_PYTHON_BASICS', 0) + 1
                continue

            # 7. قواعد البيانات SQL
            is_sql = (
                'C006' in cid_upper or
                'SQL' in cid_upper or
                'sql' in title or
                'قواعد البيانات' in title
            )
            if is_sql:
                stats['C006_SQL'] = stats.get('C006_SQL', 0) + 1
                continue

            # 8. هندسة الأوامر والذكاء الاصطناعي
            is_ai_prompt = (
                'C007' in cid_upper or
                'PROMPT' in cid_upper or
                'هندسة الأوامر' in title or
                ('ذكاء' in title and 'بايثون' not in title)
            )
            if is_ai_prompt:
                stats['C007_AI_PROMPT'] = stats.get('C007_AI_PROMPT', 0) + 1
                continue

            # 9. دبلوم رخصة قيادة الحاسوب ICDL
            is_icdl = (
                'C009' in cid_upper or
                'ICDL' in cid_upper or
                'icdl' in title or
                'قيادة الحاسوب' in title
            )
            if is_icdl:
                stats['C009_ICDL'] = stats.get('C009_ICDL', 0) + 1
                continue

            # احتياطي: إذا كان المعرف موجوداً مباشرة
            if cid in stats:
                stats[cid] = stats.get(cid, 0) + 1
            elif cid:
                stats[cid] = stats.get(cid, 0) + 1

        response = Response({
            "success": True,
            "timestamp": timezone.now().isoformat(),
            "stats": stats
        }, status=status.HTTP_200_OK)
        
        # ترويسات صارمة لمنع التخزين المؤقت في المتصفح أو أي بروكسي
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

