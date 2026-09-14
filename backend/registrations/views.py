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
        
        # القاموس المبدئي لجميع معرفات الدورات المعتمدة
        stats = {
            'C001_CPP_BASICS': 0,
            'C002_CPP_OOP': 0,
            'C003_PYTHON_BASICS': 0,
            'C004_PYTHON_DESKTOP': 0,
            'C005_PYTHON_AI': 0,
            'C006_SQL': 0,
            'C007_AI_PROMPT': 0,
            'C008_TECHLINGO': 0,
            'C009_ICDL': 0,
        }
        
        # استعلام الطلبات المقبولة فقط (status='approved')
        approved_registrations = Registration.objects.filter(status='approved')
        
        for reg in approved_registrations:
            cid = (reg.course_id or '').strip()
            title = (reg.course_title or '').strip().lower()
            
            # مطابقة ذكية للمعرفات أو العناوين لضمان عدم ضياع أي طالب مقبول
            target_key = None
            if cid in stats:
                target_key = cid
            elif 'c001' in cid.lower() or ('c++' in title and 'oop' not in title and 'كائن' not in title and 'متقدم' not in title) or 'أساسيات' in title:
                target_key = 'C001_CPP_BASICS'
            elif 'c002' in cid.lower() or 'oop' in title or 'كائن' in title:
                target_key = 'C002_CPP_OOP'
            elif 'c003' in cid.lower() or ('بايثون' in title and 'مبتدئ' in title) or ('python' in title and 'basics' in title):
                target_key = 'C003_PYTHON_BASICS'
            elif 'c004' in cid.lower() or 'desktop' in title or 'واجهات' in title or 'مكتب' in title:
                target_key = 'C004_PYTHON_DESKTOP'
            elif 'c005' in cid.lower() or 'ai' in title or ('ذكاء' in title and 'بايثون' in title):
                target_key = 'C005_PYTHON_AI'
            elif 'c006' in cid.lower() or 'sql' in title or 'بيانات' in title:
                target_key = 'C006_SQL'
            elif 'c007' in cid.lower() or 'prompt' in title or 'هندسة الأوامر' in title:
                target_key = 'C007_AI_PROMPT'
            elif 'c008' in cid.lower() or 'techlingo' in title or 'مصطلحات' in title or 'إنجليزي' in title:
                target_key = 'C008_TECHLINGO'
            elif 'c009' in cid.lower() or 'icdl' in title or 'قيادة الحاسوب' in title or 'رخصة' in title:
                target_key = 'C009_ICDL'
            elif cid:
                target_key = cid
            
            if target_key:
                stats[target_key] = stats.get(target_key, 0) + 1

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

