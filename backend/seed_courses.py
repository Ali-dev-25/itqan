"""
Script to seed the 9 standard ITQAN courses into the database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'itqan_backend.settings')
django.setup()

from registrations.models import Course

COURSES_DATA = [
    {
        'course_id': 'C001_CPP_BASICS',
        'title': 'دورة أساسيات البرمجة وحل المشكلات بلغة C++',
        'track': 'هندسة البرمجيات والمنطق البرمجي',
        'track_key': 'programming',
        'description': 'تأسيس متين في المنطق البرمجي من الصفر، يشمل المتغيرات، الجمل الشرطية، الحلقات، المصفوفات، الدوال، ومنهجية التفكير الخوارزمي وحل المشكلات (Problem Solving).',
        'duration': 'شهر تدريبي (40 ساعة تدريبية)',
        'level': 'من الصفر والمبتدئين',
        'badge': 'دورة أساسيات (شهر)',
        'icon': 'terminal',
        'color': '#2563EB',
        'bg_color': '#EFF6FF',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 20000,
        'price_in_person_original': 25000,
        'price_online_current': 15000,
        'price_online_original': 20000,
        'price_certificate': 'شاملة الشهادة المعتمدة',
        'prerequisite': '',
        'laptop_required': False,
        'sort_order': 1,
        'topics': """مقدمة في علوم الحاسوب وبنية البرامج بلغة C++
المتغيرات، أنواع البيانات، والعمليات الحسابية والمنطقية
الجمل الشرطية والتحكم في مسار البرامج (If / Switch)
حلقات التكرار المتقدمة (Loops: For, While, Do-While)
المصفوفات (Arrays) والتعامل مع النصوص والدوال (Functions)
مهارات حل المشكلات البرمجية والتفكير الخوارزمي (Problem Solving)"""
    },
    {
        'course_id': 'C002_CPP_OOP',
        'title': 'دورة البرمجة كائنية التوجه بلغة C++ (C++ OOP)',
        'track': 'هندسة البرمجيات والأنظمة',
        'track_key': 'programming',
        'description': 'دورة احترافية متقدمة في مفاهيم البرمجة كائنية التوجه (OOP)، المؤشرات (Pointers)، إدارة الذاكرة الديناميكية، وهياكل البيانات الأساسية مع مشروع تخرج عملي متكامل.',
        'duration': 'شهر تدريبي (40 ساعة تدريبية)',
        'level': 'متوسط إلى متقدم',
        'badge': 'دورة تخصصية (شهر)',
        'icon': 'layers',
        'color': '#1D4ED8',
        'bg_color': '#EFF6FF',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 20000,
        'price_in_person_original': 25000,
        'price_online_current': 15000,
        'price_online_original': 20000,
        'price_certificate': 'شاملة الشهادة المعتمدة',
        'prerequisite': 'شرط الالتحاق: يتطلب اجتياز أساسيات C++ أو امتلاك خلفية برمجية سابقة.',
        'laptop_required': False,
        'sort_order': 2,
        'topics': """مفاهيم الأصناف والكائنات (Classes & Objects) والـ Encapsulation
المشيدات والمهدمات (Constructors & Destructors)
الوراثة وتعدد الأشكال (Inheritance & Polymorphism)
المؤشرات (Pointers) وإدارة الذاكرة الديناميكية (Dynamic Memory)
التعامل مع الملفات ومقدمة هياكل البيانات (Data Structures)
مشروع عملي تخرجي متكامل لنظام حقيقي معتمد"""
    },
    {
        'course_id': 'C003_PYTHON_BASICS',
        'title': 'دورة أساسيات لغة بايثون وهياكل البيانات (Python Basics)',
        'track': 'البرمجة والأنظمة الذكية',
        'track_key': 'programming',
        'description': 'تأسيس برمجي شامل بلغة بايثون من الصفر: هياكل البيانات المتقدمة، الدوال والوحدات، التعامل مع الملفات، ومبادئ البرمجة الكائنية OOP وتصميم الأكواد النظيفة.',
        'duration': 'شهر تدريبي (40 ساعة تدريبية)',
        'level': 'من الصفر والمبتدئين',
        'badge': 'دورة أساسيات (شهر)',
        'icon': 'file-code-2',
        'color': '#10B981',
        'bg_color': '#ECFDF5',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 20000,
        'price_in_person_original': 25000,
        'price_online_current': 15000,
        'price_online_original': 20000,
        'price_certificate': 'شاملة الشهادة المعتمدة',
        'prerequisite': '',
        'laptop_required': False,
        'sort_order': 3,
        'topics': """بنية لغة بايثون وبيئة العمل والمتغيرات وأنواع البيانات
الجمل الشرطية وحلقات التكرار (For & While Loops)
هياكل البيانات: Lists, Dictionaries, Tuples, Sets
بناء الدوال (Functions)، الوحدات (Modules)، والتعامل مع الملفات
مبادئ البرمجة كائنية التوجه (OOP) وتصميم الأكواد النظيفة
مشروع تطبيقي لبناء برنامج بايثون متكامل في نهاية الدورة"""
    },
    {
        'course_id': 'C004_PYTHON_DESKTOP',
        'title': 'دورة تطوير تطبيقات سطح المكتب والواجهات الرسومية (PyQt / GUI)',
        'track': 'تطوير البرمجيات والواجهات',
        'track_key': 'programming',
        'description': 'احتراف تصميم وبرمجة واجهات المستخدم التفاعلية وتطبيقات سطح المكتب الحديثة بلغة Python ومكتبة PyQt6 مع ربطها بقواعد البيانات وبناء ملفات التثبيت التنفيذية (.exe).',
        'duration': 'شهر تدريبي (40 ساعة تدريبية)',
        'level': 'متوسط',
        'badge': 'دورة تخصصية (شهر)',
        'icon': 'monitor',
        'color': '#059669',
        'bg_color': '#ECFDF5',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 20000,
        'price_in_person_original': 25000,
        'price_online_current': 15000,
        'price_online_original': 20000,
        'price_certificate': 'شاملة الشهادة المعتمدة',
        'prerequisite': 'شرط الالتحاق: معرفة بأساسيات بايثون.',
        'laptop_required': True,
        'sort_order': 4,
        'topics': """مقدمة في بناء تطبيقات سطح المكتب وإطار عمل PyQt6
تصميم واجهات المستخدم باستخدام Qt Designer
التعامل مع الأحداث والإشارات (Signals & Slots)
ربط الواجهات الرسومية بقواعد البيانات SQLite / MySQL
تصميم نماذج وتقارير وطباعة الفواتير
حزم المشروع وتحويله إلى ملف تنفيذي (.exe) قابل للنشر"""
    },
    {
        'course_id': 'C005_PYTHON_AI',
        'title': 'دورة بايثون للذكاء الاصطناعي وتحليل البيانات (Python AI & Data)',
        'track': 'الذكاء الاصطناعي وعلم البيانات',
        'track_key': 'ai',
        'description': 'دورة تطبيقية احترافية في معالجة البيانات وبناء نماذج الذكاء الاصطناعي وتعلم الآلة باستخدام أشهر مكتبات بايثون: NumPy, Pandas, Matplotlib, Scikit-Learn.',
        'duration': 'شهر تدريبي (40 ساعة تدريبية)',
        'level': 'متوسط إلى متقدم',
        'badge': 'دورة تخصصية (شهر)',
        'icon': 'cpu',
        'color': '#7C3AED',
        'bg_color': '#F5F3FF',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 20000,
        'price_in_person_original': 25000,
        'price_online_current': 15000,
        'price_online_original': 20000,
        'price_certificate': 'شاملة الشهادة المعتمدة',
        'prerequisite': 'شرط الالتحاق: إتقان أساسيات لغة بايثون.',
        'laptop_required': True,
        'sort_order': 5,
        'topics': """العمليات الرياضية والمصفوفات المتقدمة بمكتبة NumPy
استيراد وتنظيف وتحليل البيانات الضخمة بمكتبة Pandas
تصور وتمثيل البيانات والرسوم البيانية بمكتبة Matplotlib & Seaborn
مفاهيم تعلم الآلة الأساسية (Supervised & Unsupervised Learning)
تدريب وتقييم النماذج التنبؤية بمكتبة Scikit-Learn
مشروع واقعي كامل لتحليل بيانات وبناء نموذج تنبؤ ذكي"""
    },
    {
        'course_id': 'C006_SQL',
        'title': 'دورة تصميم وإدارة قواعد البيانات المتقدمة (SQL)',
        'track': 'قواعد البيانات وهندسة النظم',
        'track_key': 'programming',
        'description': 'دورة تخصصية مكثفة من الصفر للاحتراف في تصميم قواعد البيانات العلاقية، كتابة استعلامات SQL المعقدة، الفهارس، الإجراءات المخزنة، وحماية البيانات.',
        'duration': 'شهر تدريبي (40 ساعة تدريبية)',
        'level': 'من الصفر إلى الاحتراف',
        'badge': 'دورة تخصصية (شهر)',
        'icon': 'database',
        'color': '#0284C7',
        'bg_color': '#F0F9FF',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 20000,
        'price_in_person_original': 25000,
        'price_online_current': 15000,
        'price_online_original': 20000,
        'price_certificate': 'شاملة الشهادة المعتمدة',
        'prerequisite': '',
        'laptop_required': True,
        'sort_order': 6,
        'topics': """مفاهيم قواعد البيانات العلاقية ونمذجة الكيانات (ERD)
تصميم الجداول وقيود السلامة ومطابقة المعايير (Normalization)
استعلامات الاسترجاع والترشيح والتجميع المتقدمة (DQL)
عمليات الدمج بين الجداول المتعددة (Joins & Subqueries)
الإجراءات المخزنة والمحفزات والفهارس (Stored Procedures, Triggers)
إدارة النسخ الاحتياطي والصلاحيات وحماية البيانات"""
    },
    {
        'course_id': 'C007_AI_PROMPT',
        'title': 'دورة هندسة الأوامر وتطبيقات الذكاء الاصطناعي التوليدي (Prompt Engineering)',
        'track': 'الذكاء الاصطناعي والإنتاجية',
        'track_key': 'ai',
        'description': 'اكتشف أسرار استخدام وتوجيه نماذج الذكاء الاصطناعي التوليدي مثل ChatGPT, Claude, Midjourney لمضاعفة الإنتاجية، صياغة المحتوى، البرمجة، والبحث العلمي بدقة خارقة.',
        'duration': 'شهر تدريبي (30 ساعة تدريبية)',
        'level': 'لكافة الفئات والمهتمين',
        'badge': 'دورة عصرية ومستقبلية',
        'icon': 'sparkles',
        'color': '#8B5CF6',
        'bg_color': '#F5F3FF',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 20000,
        'price_in_person_original': 25000,
        'price_online_current': 15000,
        'price_online_original': 20000,
        'price_certificate': 'شاملة الشهادة المعتمدة',
        'prerequisite': '',
        'laptop_required': False,
        'sort_order': 7,
        'topics': """مبادئ الذكاء الاصطناعي التوليدي وكيف تفكر النماذج اللغوية الكبيرة (LLMs)
أطر وهياكل صياغة الأوامر الاحترافية (Prompt Frameworks)
استخدام الذكاء الاصطناعي في كتابة المحتوى والترجمة والبحث الأكاديمي
توظيف نماذج الذكاء الاصطناعي في البرمجة وتصحيح الأخطاء (AI for Coding)
أدوات توليد وتعديل الصور والتصاميم بالذكاء الاصطناعي
أتمتة الأعمال وربط أدوات الذكاء الاصطناعي بمنصات العمل اليومية"""
    },
    {
        'course_id': 'C008_TECHLINGO',
        'title': 'دبلوم اللغة الإنجليزية المهنية TechLingo (6 مستويات)',
        'track': 'اللغات والتواصل الدولي',
        'track_key': 'languages',
        'description': 'دبلوم متكامل مكون من 6 مستويات دراسية تدرجية من الصفر وحتى الطلاقة، مصمم خصيصاً للمتخصصين ورواد التقنية والأعمال لامتلاك مهارات التواصل الأكاديمي والمهني.',
        'duration': '6 مستويات تدريبية متكاملة',
        'level': 'جميع المستويات (من الصفر حتى الطلاقة)',
        'badge': 'دبلوم لغات معتمد',
        'icon': 'globe',
        'color': '#0EA5E9',
        'bg_color': '#F0F9FF',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 10000,
        'price_in_person_original': 15000,
        'price_online_current': 10000,
        'price_online_original': 12000,
        'price_certificate': '10,000 ر.ي لكل مستوى تدريبي شاملة الشهادة المعتمدة',
        'prerequisite': '',
        'laptop_required': False,
        'sort_order': 8,
        'topics': """المستوى 1A: التأسيس الصوتي والنطق السليم وكسر حاجز الخوف
المستوى 1B: بناء المفردات الأساسية والتراكيب اليومية
المستوى 2A: المحادثة التفاعلية وقواعد اللغة الوظيفية
المستوى 2B: القراءة الفعالة والتعبير الكتابي السليم
المستوى 3A: اللغة الإنجليزية المهنية والمصطلحات التقنية وبيئة العمل
المستوى 3B: الطلاقة المتقدمة والعروض التقديمية والمقابلات الاحترافية"""
    },
    {
        'course_id': 'C009_ICDL',
        'title': 'دبلوم رخصة قيادة الحاسوب الدولية ICDL',
        'track': 'المهارات الرقمية واستخدام الحاسوب',
        'track_key': 'skills',
        'description': 'البرنامج الشامل والمعتمد دولياً لإتقان مهارات الحاسوب الأساسية وتطبيقات مايكروسوفت أوفيس (Word, Excel, PowerPoint, Access) وأساسيات الإنترنت والأمن الرقمي.',
        'duration': 'شهر تدريبي (40 ساعة تدريبية)',
        'level': 'كافة الفئات والمبتدئين',
        'badge': 'دبلوم مهارات حاسوب',
        'icon': 'award',
        'color': '#D97706',
        'bg_color': '#FFFBEB',
        'status': 'active',
        'allow_in_person': True,
        'allow_online': True,
        'min_students': 15,
        'max_students': 30,
        'price_in_person_current': 15000,
        'price_in_person_original': 20000,
        'price_online_current': 12000,
        'price_online_original': 15000,
        'price_certificate': 'شاملة الشهادة المعتمدة',
        'prerequisite': '',
        'laptop_required': False,
        'sort_order': 9,
        'topics': """أساسيات تكنولوجيا المعلومات ونظام التشغيل Windows
معالج النصوص المتقدم Microsoft Word
الجداول الإلكترونية وتحليل البيانات Microsoft Excel
العروض التقديمية التفاعلية Microsoft PowerPoint
إدارة قواعد البيانات Microsoft Access
أساسيات الإنترنت، المراسلات الإلكترونية، والأمن الرقمي"""
    }
]

created_count = 0
updated_count = 0

for item in COURSES_DATA:
    course_id = item['course_id']
    course, created = Course.objects.update_or_create(
        course_id=course_id,
        defaults=item
    )
    if created:
        created_count += 1
    else:
        updated_count += 1

print(f"Courses seeded successfully! Created: {created_count}, Updated/Existing: {updated_count}")
