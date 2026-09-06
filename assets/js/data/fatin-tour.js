/**
 * ITQAN PLATFORM — Fatin Performance & Tour Data (V5 — Balanced Natural Speed & Clean UI Texts)
 * بيانات الأداء الصوتي والحركي لشخصية «فَطِن»
 * 
 * الاسم المعتمد: فَطِن (بفتح الفاء)
 * الهوية الصوتية: ar-JO-TaimNeural (شاب حماسي، سرعة متوازنة +10%، نطق عربي متقن)
 * ملاحظة: نصوص الواجهة للمستخدم نقية بدون تشكيل، التشكيل الكامل مخصص للمحرك الصوتي فقط.
 */

// المشاهد التمهيدية في صفحة fatin.html
window.FatinIntroScenes = {
  // المشهد 1: التحية والتعريف بالنفس
  greeting: {
    id: 'intro_greeting',
    audio: 'assets/audio/fatin/scene1_intro.mp3?v=5',
    basePose: 'greeting.webp',
    title: 'فَطِن — رفيقكم في إتقان المعرفة',
    message: 'مرحبًا! أنا فَطِن، رفيقكم في إتقان المعرفة.',
    timeline: [
      { time: 0.0, pose: 'greeting.webp', gesture: 'gesture-wave', phrase: 'مرحبًا!' },
      { time: 0.8, pose: 'greeting.webp', gesture: 'gesture-self', phrase: 'أنا فَطِن،' },
      { time: 1.6, pose: 'greeting.webp', gesture: 'gesture-welcome', phrase: 'رفيقكم في إتقان المعرفة.' }
    ]
  },
  // المشهد 2: التعريف بالجولة والدعوة للانطلاق
  tourInvite: {
    id: 'intro_tour_invite',
    audio: 'assets/audio/fatin/scene2_tour_intro.mp3?v=5',
    basePose: 'pointing.webp',
    title: 'جولة استكشاف منصة إتقان 🚀',
    message: 'سآخذكم في جولة سريعة داخل منصة إتقان، وأعرّفكم بأهم ما تقدمه، وكيف يمكنكم الاستفادة منها. هيا بنا!',
    timeline: [
      { time: 0.0, pose: 'pointing.webp', gesture: 'gesture-invite', phrase: 'سآخذكم في جولة سريعة' },
      { time: 1.8, pose: 'pointing.webp', gesture: 'gesture-present', phrase: 'داخل منصة إتقان،' },
      { time: 3.1, pose: 'learning.webp', gesture: 'gesture-explain', phrase: 'وأعرّفكم بأهم ما تقدمه،' },
      { time: 4.6, pose: 'greeting.webp', gesture: 'gesture-welcome', phrase: 'وكيف يمكنكم الاستفادة منها.' },
      { time: 6.2, pose: 'pointing.webp', gesture: 'gesture-forward', phrase: 'هيا بنا!' }
    ]
  }
};

// مشاهد الجولة التفاعلية داخل الموقع الرئيسي (index.html)
window.FatinTour = {
  // المشهد 3 (1 - 7): عن منصة إتقان
  about: {
    id: 'about',
    target: '#about',
    sectionId: 'about',
    pose: 'learning.webp',
    title: 'عن منصة إتقان',
    audio: 'assets/audio/fatin/scene3_about.mp3?v=5',
    message: 'منصة إتقان تهدف إلى تقديم محتوى تدريبي وتقني يساعدكم على تطوير مهاراتكم، وتحويل المعرفة إلى تطبيق عملي.',
    timeline: [
      { time: 0.0, pose: 'learning.webp', gesture: 'gesture-present', phrase: 'منصة إتقان' },
      { time: 1.1, pose: 'learning.webp', gesture: 'gesture-explain', phrase: 'تهدف إلى تقديم محتوى تدريبي وتقني' },
      { time: 3.1, pose: 'learning.webp', gesture: 'gesture-grow', phrase: 'يساعدكم على تطوير مهاراتكم،' },
      { time: 4.8, pose: 'reading-professional.webp', gesture: 'gesture-book', phrase: 'وتحويل المعرفة إلى تطبيق عملي.' }
    ]
  },

  // المشهد 4 (2 - 7): البرامج والدورات
  courses: {
    id: 'courses',
    target: '#courses',
    sectionId: 'courses',
    pose: 'courses.webp',
    title: 'البرامج والدورات',
    audio: 'assets/audio/fatin/scene4_courses.mp3?v=5',
    message: 'هنا ستجدون البرامج والدورات التدريبية المتاحة، ويمكنكم اختيار الدورة التي تناسب أهدافكم.',
    timeline: [
      { time: 0.0, pose: 'pointing.webp', gesture: 'gesture-point', phrase: 'هنا ستجدون' },
      { time: 1.1, pose: 'courses.webp', gesture: 'gesture-present', phrase: 'البرامج والدورات التدريبية المتاحة،' },
      { time: 3.1, pose: 'courses.webp', gesture: 'gesture-choose', phrase: 'ويمكنكم اختيار الدورة' },
      { time: 4.4, pose: 'greeting.webp', gesture: 'gesture-welcome', phrase: 'التي تناسب أهدافكم.' }
    ]
  },

  // المشهد 5: الخدمات البرمجية وتطوير الأنظمة
  services: {
    id: 'services',
    target: '#services',
    sectionId: 'services',
    pose: 'pointing.webp',
    title: 'خدماتنا البرمجية وتطوير الأنظمة 💻',
    audio: 'assets/audio/fatin/scene_services.mp3?v=5',
    message: 'إلى جانب التدريب، فريق إتقان البرمجي جاهز لتصميم وتطوير مواقع الويب والأنظمة الإدارية والمحاسبية المخصصة لشركاتكم ومشاريعكم بأعلى معايير الجودة والأمان!',
    timeline: [
      { time: 0.0, pose: 'pointing.webp', gesture: 'gesture-point', phrase: 'إلى جانب التدريب،' },
      { time: 1.5, pose: 'learning.webp', gesture: 'gesture-explain', phrase: 'فريق إتقان البرمجي جاهز لتصميم وتطوير' },
      { time: 3.6, pose: 'pointing.webp', gesture: 'gesture-forward', phrase: 'مواقع الويب والأنظمة الإدارية والمحاسبية' },
      { time: 6.0, pose: 'greeting.webp', gesture: 'gesture-welcome', phrase: 'لشركاتكم ومشاريعكم بأعلى معايير الجودة والأمان!' }
    ]
  },

  // المشهد 6: مميزات المنصة
  features: {
    id: 'features',
    target: '#features',
    sectionId: 'features',
    pose: 'thinking.webp',
    title: 'مميزات إتقان',
    audio: 'assets/audio/fatin/scene5_features.mp3?v=5',
    message: 'صُممت المنصة لتجعل تجربة التعلم أكثر وضوحًا وتنظيمًا، مع التركيز على المعرفة المفيدة والتطبيق العملي.',
    timeline: [
      { time: 0.0, pose: 'thinking.webp', gesture: 'gesture-present', phrase: 'صُممت المنصة' },
      { time: 1.2, pose: 'thinking.webp', gesture: 'gesture-organize', phrase: 'لتجعل تجربة التعلم أكثر وضوحًا وتنظيمًا،' },
      { time: 3.5, pose: 'reading-professional.webp', gesture: 'gesture-book', phrase: 'مع التركيز على المعرفة المفيدة' },
      { time: 5.0, pose: 'learning.webp', gesture: 'gesture-practical', phrase: 'والتطبيق العملي.' }
    ]
  },

  // المشهد 6 (4 - 7): التسجيل
  registration: {
    id: 'how-it-works',
    target: '#how-it-works',
    sectionId: 'how-it-works',
    pose: 'registration.webp',
    title: 'طريقة التسجيل',
    audio: 'assets/audio/fatin/scene6_registration.mp3?v=5',
    message: 'عندما تجدون الدورة المناسبة، يمكنكم الانتقال إلى صفحة التسجيل وإدخال بياناتكم بكل سهولة!',
    timeline: [
      { time: 0.0, pose: 'pointing.webp', gesture: 'gesture-point', phrase: 'عندما تجدون الدورة المناسبة،' },
      { time: 1.6, pose: 'pointing.webp', gesture: 'gesture-forward', phrase: 'يمكنكم الانتقال إلى صفحة التسجيل' },
      { time: 3.3, pose: 'registration.webp', gesture: 'gesture-write', phrase: 'وإدخال بياناتكم' },
      { time: 4.6, pose: 'registration.webp', gesture: 'gesture-nod', phrase: 'بكل سهولة!' }
    ]
  },

  // المشهد 7 (5 - 7): السداد وإرفاق السند
  payment: {
    id: 'how-it-works',
    target: '#how-it-works',
    sectionId: 'how-it-works',
    pose: 'payment.webp',
    title: 'السداد وسند الدفع',
    audio: 'assets/audio/fatin/scene7_payment.mp3?v=5',
    message: 'بعد التسجيل، يمكنكم إتمام السداد باستخدام بيانات الحساب الموضحة، ثم إرفاق سند التحويل أو الإيداع.',
    timeline: [
      { time: 0.0, pose: 'payment.webp', gesture: 'gesture-next', phrase: 'بعد التسجيل،' },
      { time: 1.1, pose: 'payment.webp', gesture: 'gesture-present', phrase: 'يمكنكم إتمام السداد' },
      { time: 2.3, pose: 'pointing.webp', gesture: 'gesture-point', phrase: 'باستخدام بيانات الحساب الموضحة،' },
      { time: 4.1, pose: 'payment.webp', gesture: 'gesture-doc', phrase: 'ثم إرفاق سند التحويل أو الإيداع.' }
    ]
  },

  // المشهد 8 (6 - 7): نجاح التسجيل
  success: {
    id: 'hero',
    target: '#hero',
    sectionId: 'hero',
    pose: 'success.webp',
    title: 'تأكيد التسجيل',
    audio: 'assets/audio/fatin/scene8_success.mp3?v=5',
    message: 'وبعد إرسال الطلب بنجاح، سيظهر لكم الرقم المرجعي الخاص بالتسجيل، احتفظوا به للمتابعة!',
    timeline: [
      { time: 0.0, pose: 'success.webp', gesture: 'gesture-success', phrase: 'وبعد إرسال الطلب بنجاح،' },
      { time: 1.9, pose: 'success.webp', gesture: 'gesture-present', phrase: 'سيظهر لكم الرقم المرجعي الخاص بالتسجيل،' },
      { time: 3.9, pose: 'success.webp', gesture: 'gesture-save', phrase: 'احتفظوا به' },
      { time: 5.0, pose: 'pointing.webp', gesture: 'gesture-forward', phrase: 'للمتابعة!' }
    ]
  },

  // المشهد 9 (7 - 7): نهاية الجولة
  goodbye: {
    id: 'hero',
    target: '#hero',
    sectionId: 'hero',
    pose: 'goodbye.webp',
    title: 'نهاية الجولة',
    audio: 'assets/audio/fatin/scene9_goodbye.mp3?v=5',
    message: 'وهكذا أصبحت لديكم فكرة واضحة عن منصة إتقان وطريقة الاستفادة منها. أتمنى لكم رحلة تعليمية ممتعة ومليئة بالمعرفة. كان معكم فَطِن، رفيقكم في إتقان المعرفة. إلى اللقاء!',
    timeline: [
      { time: 0.0, pose: 'goodbye.webp', gesture: 'gesture-present', phrase: 'وهكذا أصبحت لديكم فكرة واضحة' },
      { time: 2.2, pose: 'goodbye.webp', gesture: 'gesture-explain', phrase: 'عن منصة إتقان وطريقة الاستفادة منها.' },
      { time: 4.4, pose: 'greeting.webp', gesture: 'gesture-welcome', phrase: 'أتمنى لكم رحلة تعليمية ممتعة' },
      { time: 6.3, pose: 'reading-professional.webp', gesture: 'gesture-book', phrase: 'ومليئة بالمعرفة.' },
      { time: 7.9, pose: 'greeting.webp', gesture: 'gesture-self', phrase: 'كان معكم فَطِن،' },
      { time: 9.2, pose: 'greeting.webp', gesture: 'gesture-welcome', phrase: 'رفيقكم في إتقان المعرفة.' },
      { time: 10.8, pose: 'goodbye.webp', gesture: 'gesture-wave', phrase: 'إلى اللقاء!' }
    ]
  }
};

// مصفوفة الخطوات المتسلسلة للجولة في الموقع الرئيسي
window.FatinTourSteps = [
  window.FatinTour.about,
  window.FatinTour.courses,
  window.FatinTour.services,
  window.FatinTour.features,
  window.FatinTour.registration,
  window.FatinTour.payment,
  window.FatinTour.success,
  window.FatinTour.goodbye
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FatinIntroScenes: window.FatinIntroScenes,
    FatinTour: window.FatinTour,
    FatinTourSteps: window.FatinTourSteps
  };
}
