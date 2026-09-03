/**
 * ITQAN — Courses Data Module
 * قاعدة بيانات البرامج والدورات التدريبية المعتمدة لمنصة إتقان
 * تم إفراد كل دورة في بطاقة (Card) مستقلة لتسهيل استعراضها والتسجيل فيها مباشرة
 */
const CoursesData = [
  // ==========================================
  // 1. C++ PROGRAMMING TRACK (دورات مسار C++)
  // ==========================================
  {
    id: 'C001_CPP_BASICS',
    title: 'أساسيات البرمجة بلغة C++ وحل المشكلات',
    track: 'البرمجة وتطوير تطبيقات سطح المكتب',
    trackKey: 'programming',
    description: 'تأسيس برمجي مكثف: التفكير المنطقي، المتغيرات، الجمل الشرطية، الحلقات التكرارية، المصفوفات والدوال بلغة C++.',
    instructors: ['م. محمد عيد', 'م. محمد علي', 'م. محمد عبد الله'],
    duration: 'شهر مكثف (48 ساعة تدريبية)',
    level: 'مبتدئ (من الصفر)',
    icon: 'terminal',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    featured: true,
    badge: 'تأسيس برمجي 48س',
    topics: [
      'مقدمة في الحاسوب وبيئة التطوير IDE',
      'المتغيرات، أنواع البيانات، والعمليات الحسابية والمنطقية',
      'الجمل الشرطية (if, switch) وبناء المنطق البرمجي',
      'الحلقات التكرارية (for, while, do-while)',
      'المصفوفات (Arrays) والدوال (Functions) وعلم حل المشكلات'
    ]
  },
  {
    id: 'C001_CPP_OOP',
    title: 'البرمجة كائنية التوجه بلغة C++ (C++ OOP)',
    track: 'البرمجة وتطوير تطبيقات سطح المكتب',
    trackKey: 'programming',
    description: 'دورة تخصصية في هيكلة البرامج وتطبيق مفاهيم OOP الأساسية والمتقدمة لبناء نظم برمجية احترافية ونظيفة.',
    instructors: ['م. محمد عيد', 'م. محمد علي'],
    duration: 'شهر (48 ساعة تدريبية)',
    level: 'متوسط',
    icon: 'code-2',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    featured: true,
    badge: 'برمجة كائنية OOP',
    topics: [
      'الفئات (Classes) والكائنات (Objects) والمشيدات (Constructors)',
      'التغليف (Encapsulation) ومستويات الوصول (Access Modifiers)',
      'الوراثة (Inheritance) وإعادة استخدام الكود',
      'تعدد الأشكال (Polymorphism) والدوال الافتراضية',
      'المؤشرات (Pointers) وإدارة الذاكرة الديناميكية'
    ]
  },
  {
    id: 'C001_CPP_SQL',
    title: 'تصميم وقواعد البيانات والربط بلغة SQL & C++',
    track: 'البرمجة وتطوير تطبيقات سطح المكتب',
    trackKey: 'programming',
    description: 'تصميم قواعد البيانات العلائقية وبنائها بلغة SQL، وربطها بالتطبيقات البرمجية لبناء أنظمة إدارية متكاملة.',
    instructors: ['م. محمد عبد الله'],
    duration: 'شهر + أسبوع مشاريع',
    level: 'متوسط إلى متقدم',
    icon: 'database',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    featured: true,
    badge: 'قواعد بيانات SQL',
    topics: [
      'أساسيات قواعد البيانات العلائقية (Relational Databases)',
      'لغة الاستعلام SQL (SELECT, INSERT, UPDATE, DELETE)',
      'العلاقات والمفاتيح (Primary & Foreign Keys, Joins)',
      'ربط قواعد البيانات بلغة C++ وتطبيقات سطح المكتب',
      'مشروع تخرج تطبيقي لبناء نظام إدارة حقيقي'
    ]
  },

  // ==========================================
  // 2. PYTHON TRACK (دورات مسار بايثون)
  // ==========================================
  {
    id: 'C002_PY_BASICS',
    title: 'أساسيات البرمجة بلغة بايثون (Python Fundamentals)',
    track: 'البرمجة وتطوير تطبيقات سطح المكتب',
    trackKey: 'programming',
    description: 'دورة مكثفة لتأسيس واحتراف لغة بايثون من الصفر: البرمجة السليمة، التعامل مع البيانات، وهياكل البيانات الأساسية.',
    instructors: ['م. محمد عيد'],
    duration: 'شهر مكثف (48 ساعة تدريبية)',
    level: 'مبتدئ (من الصفر)',
    icon: 'file-code-2',
    color: '#10B981',
    bgColor: '#ECFDF5',
    featured: true,
    badge: 'أساسيات بايثون',
    topics: [
      'تثبيت بايثون والتعامل مع بيئة التطوير VS Code / PyCharm',
      'أنواع البيانات الأساسية (Strings, Numbers, Booleans)',
      'القوائم والمعاجم (Lists, Tuples, Dictionaries, Sets)',
      'الدوال والوحدات (Functions & Modules)',
      'معالجة الأخطاء والتعامل مع الملفات (File Handling)'
    ]
  },
  {
    id: 'C002_PY_DESKTOP',
    title: 'تطوير تطبيقات سطح المكتب بلغة بايثون (Python Desktop Apps)',
    track: 'البرمجة وتطوير تطبيقات سطح المكتب',
    trackKey: 'programming',
    description: 'بناء واجهات رسومية احترافية لتطبيقات الحاسوب باستخدام PyQt/Tkinter وربطها بقواعد البيانات لإنشاء برامج حقيقية.',
    instructors: ['م. محمد علي'],
    duration: '6 أسابيع (شهر ونصف)',
    level: 'متوسط',
    icon: 'layout',
    color: '#059669',
    bgColor: '#F0FDF4',
    featured: true,
    badge: 'تطبيقات سطح المكتب',
    topics: [
      'تصميم واجهات المستخدم الرسومية (GUI Design)',
      'التعامل مع الأحداث والأزرار والنماذج (Events & Inputs)',
      'ربط التطبيقات بقواعد البيانات (SQLite / PostgreSQL)',
      'تحويل تطبيقات بايثون إلى ملفات تنفيذية (.exe)',
      'مشروع تطبيق سطح مكتب كامل لخدمة الأعمال'
    ]
  },
  {
    id: 'C002_PY_AI',
    title: 'إنشاء وتدريب نماذج الذكاء الاصطناعي (Python AI & ML)',
    track: 'الذكاء الاصطناعي والبيانات',
    trackKey: 'ai',
    description: 'مسار تخصصي في تحليل البيانات، التعلم الآلي (Machine Learning)، وإنشاء وتدريب النماذج الذكية بلغة بايثون.',
    instructors: ['م. محمد عيد'],
    duration: '6 أسابيع (شهر ونصف)',
    level: 'متقدم',
    icon: 'brain-circuit',
    color: '#D97706',
    bgColor: '#FEF3C7',
    featured: true,
    badge: 'نماذج الذكاء الاصطناعي',
    topics: [
      'مكتبات بايثون للبيانات (NumPy & Pandas)',
      'تمثيل البيانات وتحليلها (Matplotlib & Seaborn)',
      'أساسيات خوارزميات التعلم الآلي (Scikit-Learn)',
      'بناء وتدريب وتقييم النماذج التنبؤية',
      'مشروع تطبيق ذكاء اصطناعي عملي'
    ]
  },

  // ==========================================
  // 3. AI & PROMPT ENGINEERING TRACK
  // ==========================================
  {
    id: 'C004_AI_PROMPT',
    title: 'دورة استخدام وتطويع نماذج الذكاء الاصطناعي (Applied AI & Prompt Engineering)',
    track: 'الذكاء الاصطناعي والبيانات',
    trackKey: 'ai',
    description: 'تطبيق عملي لنماذج الذكاء الاصطناعي، وهندسة المطالبات (Prompt Engineering)، وأدوات البرمجة الذكية وإعادة الأتمتة.',
    instructors: ['م. محمد عبد الله'],
    duration: 'أسبوعان (20 ساعة تدريبية)',
    level: 'جميع المستويات',
    icon: 'cpu',
    color: '#F59E0B',
    bgColor: '#FFFBEB',
    featured: true,
    badge: 'الأكثر طلباً',
    topics: [
      'هندسة الأوامر المتقدمة (Advanced Prompt Engineering)',
      'استخدام وتطويع النماذج اللغوية الكبرى (ChatGPT, Claude, DeepSeek)',
      'أدوات التطوير والبرمجة بالذكاء الاصطناعي (Cursor, Copilot, Cline)',
      'أتمتة الأعمال وسير العمل الذكي (AI Automations)',
      'إنتاج المحتوى وتصميم حلول الأعمال بالذكاء الاصطناعي'
    ]
  },

  // ==========================================
  // 4. LANGUAGES & IT ENGLISH TRACK
  // ==========================================
  {
    id: 'C003_TECHLINGO',
    title: 'دبلوم اللغة الإنجليزية التخصصية للحاسوب (TechLingo Diploma)',
    track: 'اللغات والمهارات المهنية',
    trackKey: 'languages',
    description: '6 مستويات معتمدة لتطوير مهارات اللغة الإنجليزية التقنية والمهنية في مجال الحاسوب وتقنية المعلومات.',
    instructors: ['نخبة من مدربي اللغات التقنية'],
    duration: '6 مستويات (4 أسابيع لكل مستوى)',
    level: 'كافة المستويات (1A إلى 3B)',
    icon: 'languages',
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
    featured: true,
    badge: '6 مستويات معتمدة',
    topics: [
      'المستوى 1A: أساسيات مصطلحات IT والعتاد والبرمجيات',
      'المستوى 1B: الشبكات والدعم الفني وأمن المعلومات',
      'المستوى 2A: الأنظمة والبرمجيات والبنية التقنية',
      'المستوى 2B: تطوير الأنظمة وإدارة المشاريع',
      'المستوى 3A & 3B: المقابلات التقنية والتوثيق والتواصل المهني'
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CoursesData;
}
