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
    GET /api/v1/registrations/stats/
    """
    def get(self, request, *args, **kwargs):
        from django.db.models import Count
        stats = {}
        # تصفية الطلبات المقبولة حصراً من قبل الأدمن
        counts = Registration.objects.filter(status='approved').values('course_id').annotate(total=Count('id'))
        for item in counts:
            stats[item['course_id']] = item['total']
        return Response({
            "success": True,
            "stats": stats
        }, status=status.HTTP_200_OK)

