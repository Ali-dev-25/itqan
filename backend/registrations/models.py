"""
ITQAN — Registration Model
نموذج قاعدة البيانات لطلبات التسجيل الإلكتروني
"""
from django.db import models
from django.core.validators import FileExtensionValidator


class Registration(models.Model):
    """
    نموذج طلب التسجيل الإلكتروني في منصة إتقان
    كل سجل يمثل طلب تسجيل طالب في دورة تدريبية محددة مع سند الدفع
    """

    STATUS_CHOICES = [
        ('pending', 'قيد المراجعة'),
        ('approved', 'مقبول'),
        ('rejected', 'مرفوض'),
    ]

    # الرقم المرجعي الفريد (يتم توليده تلقائياً عند الحفظ)
    reference_number = models.CharField(
        max_length=30,
        unique=True,
        verbose_name='الرقم المرجعي',
        help_text='رقم مرجعي فريد للطلب مثل: ITQ-2026-5821'
    )

    # بيانات الطالب الشخصية
    full_name_ar = models.CharField(
        max_length=255,
        verbose_name='الاسم بالعربي'
    )
    full_name_en = models.CharField(
        max_length=255,
        blank=True,
        default='',
        verbose_name='الاسم بالإنجليزي'
    )
    phone = models.CharField(
        max_length=30,
        verbose_name='رقم الجوال'
    )
    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='تاريخ الميلاد'
    )
    birth_place = models.CharField(
        max_length=150,
        blank=True,
        default='',
        verbose_name='مكان الميلاد'
    )

    # بيانات الدورة التدريبية
    course_id = models.CharField(
        max_length=50,
        verbose_name='معرف الدورة'
    )
    course_title = models.CharField(
        max_length=255,
        verbose_name='اسم الدورة'
    )

    # ملف سند الدفع
    receipt_file = models.FileField(
        upload_to='receipts/%Y/%m/',
        verbose_name='سند الدفع',
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'pdf', 'webp'],
                message='صيغة الملف غير مدعومة. الصيغ المسموحة: JPG, JPEG, PNG, PDF, WEBP'
            )
        ],
        help_text='صورة أو مستند سند الحوالة / الإيداع (JPG, PNG, WEBP, PDF — حد أقصى 5MB)'
    )

    # حالة الطلب
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='حالة الطلب'
    )

    # التواريخ
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاريخ الإرسال'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='آخر تحديث'
    )

    class Meta:
        verbose_name = 'طلب تسجيل'
        verbose_name_plural = 'طلبات التسجيل'
        ordering = ['-created_at']
        # منع التسجيل المكرر: نفس الرقم في نفس الدورة
        constraints = [
            models.UniqueConstraint(
                fields=['phone', 'course_id'],
                name='unique_phone_course',
                violation_error_message='رقم الجوال مسجل مسبقاً في هذه الدورة'
            )
        ]

    def __str__(self):
        return f"{self.reference_number} — {self.full_name_ar}"
