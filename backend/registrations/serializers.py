"""
ITQAN — Registration Serializer
التحقق من صحة بيانات التسجيل وتحويلها من camelCase إلى snake_case
"""
from rest_framework import serializers
from .models import Registration


class RegistrationSerializer(serializers.Serializer):
    """
    Serializer لاستقبال بيانات التسجيل من الـ Frontend
    يتعامل مع أسماء الحقول بصيغة camelCase كما يرسلها الـ Frontend
    ويحولها إلى snake_case لحفظها في قاعدة البيانات
    """

    # الحقول الإلزامية الأساسية
    fullNameAr = serializers.CharField(
        max_length=255,
        min_length=3,
        error_messages={
            'required': 'يرجى إدخال الاسم الكامل باللغة العربية',
            'blank': 'يرجى إدخال الاسم الكامل باللغة العربية',
            'min_length': 'الاسم بالعربي يجب أن يكون 3 أحرف على الأقل',
            'max_length': 'الاسم طويل جداً، الحد الأقصى 255 حرف',
        }
    )
    fullNameEn = serializers.CharField(
        max_length=255,
        min_length=3,
        error_messages={
            'required': 'يرجى إدخال الاسم الكامل باللغة الإنجليزية',
            'blank': 'يرجى إدخال الاسم الكامل باللغة الإنجليزية',
            'min_length': 'الاسم بالإنجليزي يجب أن يكون 3 أحرف على الأقل',
            'max_length': 'الاسم بالإنجليزي طويل جداً، الحد الأقصى 255 حرف',
        }
    )
    phone = serializers.CharField(
        max_length=30,
        min_length=9,
        error_messages={
            'required': 'يرجى إدخال رقم الجوال للتواصل',
            'blank': 'يرجى إدخال رقم الجوال للتواصل',
            'min_length': 'رقم الجوال يجب أن يكون 9 أرقام على الأقل',
        }
    )
    residenceLocation = serializers.ChoiceField(
        choices=['inside_yemen', 'outside_yemen'],
        error_messages={
            'required': 'يرجى تحديد موقع الإقامة (داخل الوطن أم من بلد آخر)',
            'invalid_choice': 'يرجى اختيار موقع إقامة صحيح (داخل الوطن أم من بلد آخر)',
        }
    )
    attendanceMode = serializers.ChoiceField(
        choices=['in_person', 'online'],
        error_messages={
            'required': 'يرجى تحديد نمط الحضور (حضوري أم عن بعد)',
            'invalid_choice': 'يرجى اختيار نمط حضور صحيح (حضوري أم عن بعد)',
        }
    )
    birthDate = serializers.DateField(
        required=True,
        error_messages={
            'required': 'يرجى إدخال تاريخ الميلاد',
            'invalid': 'صيغة التاريخ غير صحيحة، يرجى استخدام الصيغة: YYYY-MM-DD',
        }
    )
    birthPlace = serializers.CharField(
        max_length=150,
        min_length=2,
        required=True,
        error_messages={
            'required': 'يرجى إدخال مكان الميلاد / المدينة',
            'blank': 'يرجى إدخال مكان الميلاد / المدينة',
        }
    )
    courseId = serializers.CharField(
        max_length=50,
        error_messages={
            'required': 'يرجى اختيار الدورة التدريبية',
            'blank': 'يرجى اختيار الدورة التدريبية',
        }
    )
    courseTitle = serializers.CharField(
        max_length=255,
        error_messages={
            'required': 'يرجى تحديد اسم الدورة',
            'blank': 'يرجى تحديد اسم الدورة',
        }
    )

    # ملف سند الدفع: يتم التحقق منه شرطياً حسب موقع الإقامة
    receiptFile = serializers.FileField(
        required=False,
        allow_null=True,
        error_messages={
            'empty': 'الملف المرفق فارغ، يرجى اختيار ملف صالح',
        }
    )

    def validate_phone(self, value):
        """التحقق من أن رقم الجوال يحتوي على أرقام فقط"""
        cleaned = value.strip().replace(' ', '').replace('-', '').replace('+', '')
        if not cleaned.isdigit():
            raise serializers.ValidationError('رقم الجوال يجب أن يحتوي على أرقام فقط')
        return value.strip()

    def validate_receiptFile(self, value):
        """التحقق من نوع وحجم ملف السند إن وجد"""
        if not value:
            return value

        # التحقق من الحجم (5MB كحد أقصى)
        max_size = 5 * 1024 * 1024  # 5MB
        if value.size > max_size:
            raise serializers.ValidationError(
                'حجم الملف يتجاوز الحد المسموح به (5MB)'
            )

        # التحقق من نوع الملف
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pjpeg', 'application/pdf'
        ]
        if hasattr(value, 'content_type') and value.content_type.lower() not in allowed_types:
            raise serializers.ValidationError(
                'صيغة الملف غير مدعومة. الصيغ المسموحة: JPG, PNG, WEBP, PDF'
            )

        # التحقق من الامتداد
        allowed_extensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
        ext = value.name.rsplit('.', 1)[-1].lower() if '.' in value.name else ''
        if ext not in allowed_extensions:
            raise serializers.ValidationError(
                'امتداد الملف غير مدعوم. الامتدادات المسموحة: jpg, jpeg, png, webp, pdf'
            )

        return value

    def validate(self, data):
        """
        التحقق المتقاطع:
        1. منع التسجيل المكرر (نفس الجوال + نفس الدورة)
        2. التحقق من إلزامية سند الدفع للطلاب من داخل الوطن فقط
        """
        residence = data.get('residenceLocation', 'inside_yemen')
        receipt = data.get('receiptFile')

        if residence == 'inside_yemen' and not receipt:
            raise serializers.ValidationError({
                'receiptFile': ['يرجى إرفاق صورة أو مستند سند الحوالة / الإيداع لإتمام التسجيل للطلاب داخل الوطن']
            })

        phone = data.get('phone', '').strip()
        course_id = data.get('courseId', '')

        if phone and course_id:
            exists = Registration.objects.filter(
                phone=phone,
                course_id=course_id
            ).exists()
            if exists:
                raise serializers.ValidationError({
                    'phone': ['رقم الجوال مسجل مسبقاً في هذه الدورة']
                })

        return data
