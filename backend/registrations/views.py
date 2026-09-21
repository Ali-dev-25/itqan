"""
ITQAN — Registration Views
معالجة طلبات التسجيل الإلكتروني وإرجاع الردود بصيغة JSON القياسية
"""
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Registration, Course
from .serializers import RegistrationSerializer, CourseSerializer
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
                full_name_en=validated_data['fullNameEn'],
                phone=validated_data['phone'],
                residence_location=validated_data['residenceLocation'],
                attendance_mode=validated_data['attendanceMode'],
                course_id=validated_data['courseId'],
                course_title=validated_data['courseTitle'],
                birth_date=validated_data.get('birthDate'),
                birth_place=validated_data.get('birthPlace', ''),
                receipt_file=validated_data.get('receiptFile'),
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
            residence_text = 'داخل الوطن (اليمن)' if registration.residence_location == 'inside_yemen' else 'خارج الوطن'
            attendance_text = 'حضوري' if registration.attendance_mode == 'in_person' else 'عن بعد (أونلاين)'
            success_msg = "تم استلام طلب التسجيل وسند السداد بنجاح" if registration.receipt_file else "تم استلام بيانات التسجيل بنجاح، بانتظار إرسال سند السداد عبر الواتساب"

            return Response({
                "success": True,
                "reference": ref_number,
                "message": success_msg,
                "timestamp": formatted_time,
                "data": {
                    "referenceNumber": ref_number,
                    "studentName": registration.full_name_ar,
                    "phone": registration.phone,
                    "courseId": registration.course_id,
                    "courseTitle": registration.course_title,
                    "residenceLocation": registration.residence_location,
                    "residenceText": residence_text,
                    "attendanceMode": registration.attendance_mode,
                    "attendanceText": attendance_text,
                    "hasReceipt": bool(registration.receipt_file),
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

        # قاموس تفصيلي لتقسيم الحضور (حضوري وعن بعد)
        breakdown = {}
        for k in stats.keys():
            breakdown[k] = {'in_person': 0, 'online': 0, 'total': 0}

        def record_reg(course_key, attendance_mode):
            m = attendance_mode if attendance_mode in ['in_person', 'online'] else 'in_person'
            stats[course_key] = stats.get(course_key, 0) + 1
            if course_key not in breakdown:
                breakdown[course_key] = {'in_person': 0, 'online': 0, 'total': 0}
            breakdown[course_key][m] += 1
            breakdown[course_key]['total'] += 1
        
        for reg in approved_registrations:
            cid = (reg.course_id or '').strip()
            cid_upper = cid.upper()
            title = (reg.course_title or '').strip().lower()
            att_mode = getattr(reg, 'attendance_mode', 'in_person') or 'in_person'
            
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
                record_reg('C008_TECHLINGO', att_mode)
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
                    record_reg(matched_level, att_mode)
                continue

            # 2. دورة C++ OOP
            is_cpp_oop = (
                'C002' in cid_upper or
                'CPP_OOP' in cid_upper or
                ('c++' in title and ('oop' in title or 'كائن' in title or 'كائنية' in title))
            )
            if is_cpp_oop:
                record_reg('C002_CPP_OOP', att_mode)
                continue

            # 3. دورة أساسيات C++ (حصرية لـ C++ لمنع احتساب أي دورة أخرى تحتوي كلمة أساسيات)
            is_cpp_basics = (
                'C001' in cid_upper or
                'CPP_BASICS' in cid_upper or
                ('c++' in title and not ('oop' in title or 'كائن' in title or 'كائنية' in title))
            )
            if is_cpp_basics:
                record_reg('C001_CPP_BASICS', att_mode)
                continue

            # 4. بايثون - تطبيقات سطح المكتب والواجهات PyQt
            is_py_desktop = (
                'C004' in cid_upper or
                'DESKTOP' in cid_upper or
                ('بايثون' in title and ('مكتب' in title or 'واجهات' in title or 'pyqt' in title or 'gui' in title))
            )
            if is_py_desktop:
                record_reg('C004_PYTHON_DESKTOP', att_mode)
                continue

            # 5. بايثون - ذكاء اصطناعي وتحليل بيانات
            is_py_ai = (
                'C005' in cid_upper or
                ('PYTHON' in cid_upper and 'AI' in cid_upper) or
                ('بايثون' in title and ('ذكاء' in title or 'بيانات' in title or 'تعلم الآلة' in title or 'machine' in title))
            )
            if is_py_ai:
                record_reg('C005_PYTHON_AI', att_mode)
                continue

            # 6. أساسيات بايثون
            is_py_basics = (
                'C003' in cid_upper or
                'PYTHON_BASICS' in cid_upper or
                ('بايثون' in title and not ('مكتب' in title or 'واجهات' in title or 'ذكاء' in title or 'بيانات' in title))
            )
            if is_py_basics:
                record_reg('C003_PYTHON_BASICS', att_mode)
                continue

            # 7. قواعد البيانات SQL
            is_sql = (
                'C006' in cid_upper or
                'SQL' in cid_upper or
                'sql' in title or
                'قواعد البيانات' in title
            )
            if is_sql:
                record_reg('C006_SQL', att_mode)
                continue

            # 8. هندسة الأوامر والذكاء الاصطناعي
            is_ai_prompt = (
                'C007' in cid_upper or
                'PROMPT' in cid_upper or
                'هندسة الأوامر' in title or
                ('ذكاء' in title and 'بايثون' not in title)
            )
            if is_ai_prompt:
                record_reg('C007_AI_PROMPT', att_mode)
                continue

            # 9. دبلوم رخصة قيادة الحاسوب ICDL
            is_icdl = (
                'C009' in cid_upper or
                'ICDL' in cid_upper or
                'icdl' in title or
                'قيادة الحاسوب' in title
            )
            if is_icdl:
                record_reg('C009_ICDL', att_mode)
                continue

            # احتياطي: إذا كان المعرف موجوداً مباشرة أو لأي دورة مضافة جديدة
            if cid:
                record_reg(cid, att_mode)

        # استعلام كافة الدورات المسجلة في قاعدة البيانات وإعداداتها
        db_courses = Course.objects.all()
        course_config = {}
        for c in db_courses:
            if c.course_id not in stats:
                stats[c.course_id] = 0
            course_config[c.course_id] = {
                'status': c.status,
                'allow_in_person': c.allow_in_person,
                'allow_online': c.allow_online,
                'min_students': c.min_students,
                'max_students': c.max_students
            }

        # دمج بيانات التقسيم لكل دورة لسهولة الوصول المباشر
        for k, v in breakdown.items():
            stats[f"{k}_in_person"] = v['in_person']
            stats[f"{k}_online"] = v['online']
            stats[f"{k}_total"] = v['total']

        response = Response({
            "success": True,
            "timestamp": timezone.now().isoformat(),
            "stats": stats,
            "breakdown": breakdown,
            "config": course_config
        }, status=status.HTTP_200_OK)
        
        # ترويسات صارمة لمنع التخزين المؤقت في المتصفح أو أي بروكسي
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response


class CourseListAPIView(APIView):
    """
    نقطة النهاية لجلب كافة البرامج والدورات التدريبية المعتمدة
    GET /api/v1/courses/
    """
    def get(self, request, *args, **kwargs):
        courses = Course.objects.all().order_by('sort_order', 'id')
        serializer = CourseSerializer(courses, many=True)
        response = Response({
            "success": True,
            "courses": serializer.data
        }, status=status.HTTP_200_OK)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response


