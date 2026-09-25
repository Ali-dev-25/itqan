# منصة «إتقان» — نظام الويب والـ Backend المتكامل

منصة تدريبية وتعليمية رائدة متخصصة في تأهيل الكوادر التقنية والمهنية عبر برامج ودورات عملية تواكب متطلبات سوق العمل (C++, Python, English for IT, Applied AI).

---
## 🌟 وظائف ومكونات المشروع الأساسية

1. **بوابة شخصية «فِطِن» الافتتاحية (`fatin.html`):**
   - صفحة بداية مستقلة وأنيقة تتمحور حول شخصية المرشد التفاعلي ثلاثي الأبعاد **«فِطِن»**.
2. **الموقع التعريفي العام والجولة التفاعلية (`index.html`):**
   - واجهة عصرية للمنصة مع شريط علوي، بطاقات الدورات التفاعلية، وزر **«مواضيع الدورة»** لعرض المحاور والمستويات.
3. **صفحة التسجيل الإلكتروني والسداد (`register.html`):**
   - نموذج بيانات الطالب، الحساب البنكي المعتمد، ورفع سند الدفع (JPG, PNG, PDF حتى 5MB).
4. **الـ Django REST API ولوحة الإدارة (`backend/`):**
   - معالجة طلبات التسجيل، توليد الرقم المرجعي الفريد `ITQ-2026-XXXX`، منع التكرار، وتصدير إكسل فوري.

---

## 🚀 طريقة التشغيل والمعاينة محلياً

انقر مرتين على ملف:
**`تشغيل_المنصة.bat`**

أو عبر سطر الأوامر:
```bash
# 1. الدخول لمجلد الباكاند
cd backend

# 2. تشغيل السيرفر
python manage.py runserver 8000

--

## 🌐 خطوات رفع ونشر المنصة على Render مجاناً (Step-by-Step)

تم تجهيز ملفات النشر (`build.sh`, `render.yaml`, `requirements.txt`) مسبقاً! كل ما عليك:

### الخطوة 1: رفع المشروع إلى مستودع GitHub
```bash
git init
git add .
git commit -m "Initial commit for Itqan platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/itqan.git
git push -u origin main
```

### الخطوة 2: إنشاء حساب ومشروع في Render
1. ادخل إلى موقع [render.com](https://render.com) وسجّل دخولك بحساب **GitHub**.
2. اضغط على زر **`New +`** ثم اختر **`Web Service`**.
3. اختر مستودع **`itqan`** من قائمة مستودعاتك في GitHub.

### الخطوة 3: ضبط إعدادات النشر (Settings)
قم بتعبئة الحقول التالية:
* **Name:** `itqan-platform` (أو أي اسم تفضله)
* **Region:** `Frankfurt (EU)` (الأقرب للشرق الأوسط)
* **Branch:** `main`
* **Runtime:** `Python 3`
* **Build Command:** `./build.sh`
* **Start Command:** `gunicorn --chdir backend itqan_backend.wsgi:application --bind 0.0.0.0:$PORT`
* **Instance Type:** `Free`

### الخطوة 4: (اختياري) إنشاء حساب المشرف على Render
بعد اكتمال الرفع بنجاح:
1. اذهب إلى تبويب **`Shell`** داخل لوحة تحكم الخدمة في Render.
2. اكتب الأمر:
   ```bash
   python backend/manage.py createsuperuser
   ```
3. أدخل اسم المستخدم وكلمة المرور للدخول إلى لوحة تحكم موقعك الأونلاين عبر: `https://your-app.onrender.com/admin/`.

---

**© 2026 منصة «إتقان» للمحتوى التعليمي والتقني — جميع الحقوق محفوظة.**
