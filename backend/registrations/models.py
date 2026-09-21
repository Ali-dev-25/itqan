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

    ATTENDANCE_CHOICES = [
        ('in_person', 'حضوري'),
        ('online', 'عن بعد'),
    ]

    RESIDENCE_CHOICES = [
        ('inside_yemen', 'داخل الوطن (اليمن)'),
        ('outside_yemen', 'خارج الوطن (بلد آخر)'),
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
        verbose_name='الاسم بالإنجليزي'
    )
    phone = models.CharField(
        max_length=30,
        verbose_name='رقم الجوال'
    )
    residence_location = models.CharField(
        max_length=30,
        choices=RESIDENCE_CHOICES,
        default='inside_yemen',
        verbose_name='موقع الإقامة'
    )
    attendance_mode = models.CharField(
        max_length=30,
        choices=ATTENDANCE_CHOICES,
        default='in_person',
        verbose_name='نمط الحضور'
    )
    birth_date = models.DateField(
        null=True,
        blank=True,
        verbose_name='تاريخ الميلاد'
    )
    birth_place = models.CharField(
        max_length=150,
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

    # ملف سند الدفع (اختياري للطلاب من خارج الوطن)
    receipt_file = models.FileField(
        upload_to='receipts/%Y/%m/',
        null=True,
        blank=True,
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


class Course(models.Model):
    """
    نموذج الدورة التدريبية المعتمدة في منصة إتقان
    يسمح للإدارة بالتحكم بحالتها (نشطة/موقفة)، وخيارات الحضور، وإضافة دورات جديدة ديناميكياً
    """
    STATUS_CHOICES = [
        ('active', 'نشطة ومتاحة للتسجيل'),
        ('suspended', 'موقفة حالياً (معطلة مؤقتاً)'),
    ]

    TRACK_CHOICES = [
        ('programming', 'البرمجة وهندسة البرمجيات'),
        ('ai', 'الذكاء الاصطناعي والبيانات'),
        ('languages', 'اللغات والترجمة'),
        ('skills', 'المهارات والأنظمة والحاسوب'),
        ('other', 'مسار تدريبي عام / تخصصي آخر'),
    ]

    course_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='معرف الدورة الفريد',
        help_text='رمز أو كود فريد للدورة مثل: C001_CPP_BASICS أو C010_CYBER'
    )
    title = models.CharField(
        max_length=255,
        verbose_name='عنوان / اسم الدورة'
    )
    track = models.CharField(
        max_length=150,
        verbose_name='اسم المسار المعروض',
        help_text='مثال: هندسة البرمجيات والمنطق البرمجي'
    )
    track_key = models.CharField(
        max_length=50,
        choices=TRACK_CHOICES,
        default='programming',
        verbose_name='تصنيف المسار (للفلترة)'
    )
    description = models.TextField(
        verbose_name='وصف الدورة'
    )
    duration = models.CharField(
        max_length=100,
        default='شهر تدريبي (40 ساعة تدريبية)',
        verbose_name='المدة التدريبية والساعات'
    )
    level = models.CharField(
        max_length=100,
        default='من الصفر والمبتدئين',
        verbose_name='المستوى المستهدف'
    )
    badge = models.CharField(
        max_length=100,
        blank=True,
        default='دورة تخصصية',
        verbose_name='الشارة العلوية (Badge)',
        help_text='مثال: دورة أساسيات (شهر)، دبلوم معتمد، إلخ'
    )
    icon = models.CharField(
        max_length=50,
        default='book-open',
        verbose_name='أيقونة Lucide',
        help_text='اسم الأيقونة مثل: terminal, layers, file-code-2, cpu, database, sparkle, globe, monitor'
    )
    color = models.CharField(
        max_length=30,
        default='#2563EB',
        verbose_name='كود اللون الأساسي (#hex)',
        help_text='مثال: #2563EB, #10B981, #7C3AED, #D97706'
    )
    bg_color = models.CharField(
        max_length=30,
        default='#EFF6FF',
        verbose_name='كود لون الخلفية (#hex)',
        help_text='مثال: #EFF6FF, #ECFDF5, #F5F3FF, #FFFBEB'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        verbose_name='حالة الدورة والتسجيل'
    )
    allow_in_person = models.BooleanField(
        default=True,
        verbose_name='إتاحة التدريب الحضوري بالمقر'
    )
    allow_online = models.BooleanField(
        default=True,
        verbose_name='إتاحة التدريب عن بعد (Online)'
    )
    min_students = models.PositiveIntegerField(
        default=15,
        verbose_name='الحد الأدنى للبدء (طالب)'
    )
    max_students = models.PositiveIntegerField(
        default=30,
        verbose_name='الحد الأقصى للسعة (مقعد)'
    )
    price_in_person_current = models.PositiveIntegerField(
        default=20000,
        verbose_name='رسوم التدريب الحضوري الحالية (ريال)'
    )
    price_in_person_original = models.PositiveIntegerField(
        default=25000,
        blank=True,
        null=True,
        verbose_name='رسوم الحضوري قبل الخصم (اختياري)'
    )
    price_online_current = models.PositiveIntegerField(
        default=15000,
        verbose_name='رسوم التدريب عن بعد Online الحالية (ريال)'
    )
    price_online_original = models.PositiveIntegerField(
        default=20000,
        blank=True,
        null=True,
        verbose_name='رسوم الأونلاين قبل الخصم (اختياري)'
    )
    price_certificate = models.CharField(
        max_length=150,
        default='شاملة الشهادة المعتمدة',
        verbose_name='ملاحظة الشهادة'
    )
    prerequisite = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='المتطلب السابق (إن وجد)'
    )
    laptop_required = models.BooleanField(
        default=False,
        verbose_name='يشترط إحضار لابتوب خاص'
    )
    topics = models.TextField(
        blank=True,
        verbose_name='محاور ومفردات الدورة',
        help_text='اكتب كل محور في سطر مستقل'
    )
    featured = models.BooleanField(
        default=True,
        verbose_name='دورة مميزة (تظهر في الرئيسية)'
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        verbose_name='ترتيب الظهور'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاريخ الإضافة'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='آخر تحديث'
    )

    class Meta:
        verbose_name = 'دورة تدريبية'
        verbose_name_plural = 'الدورات والبرامج التدريبية'
        ordering = ['sort_order', 'id']

    def __str__(self):
        status_sym = '🟢' if self.status == 'active' else '🔴 [موقفة]'
        return f"{status_sym} {self.title} ({self.course_id})"

    def get_topics_list(self):
        if not self.topics:
            return []
        return [line.strip() for line in self.topics.splitlines() if line.strip()]
