# دليل تكامل الـ Backend (Django Integration Guide) — منصة «إتقان»

هذا المستند مخصص لمطور الـ **Backend (Django)** لربط واجهات الـ Frontend بنظام معالجة وتخزين طلبات التسجيل الإلكتروني.

---

## 📌 نظرة عامة على دور الـ Backend

الـ Frontend تم بناؤه وعزله بالكامل ليكون جاهزاً للربط المباشر مع Django.
مهمة الـ Backend تتلخص في:
1. استقبال طلبات التسجيل الواردة عبر نقطة النهاية (Endpoint).
2. التحقق من صحة البيانات على مستوى السيرفر (Server-side validation).
3. حفظ بيانات الطالب في قاعدة البيانات (PostgreSQL / SQLite).
4. حفظ وتخزين ملف سند الحوالة / الإيداع المرفوع في مجلد الـ `MEDIA` أو خدمة التخزين السحابي (S3/Cloud Storage).
5. توليد رقم مرجعي فريد لكل طلب تسجيل (مثال: `ITQ-2026-XXXX`).
6. تصدير/تحديث بيانات الطلبات في ملف Excel إداري.
7. إرجاع استجابة JSON موحدة للواجهة لإظهار إشعار تأكيد التسجيل للمستخدم.

---

## 🌐 نقطة النهاية المقترحة (API Endpoint)

| الخاصية | القيمة |
|---|---|
| **URL** | `/api/v1/registrations/` (أو `/api/register/`) |
| **HTTP Method** | `POST` |
| **Content-Type** | `multipart/form-data` |
| **Authentication** | لا يتطلب مصادقة (Public Endpoint مخصص للزوار) |

---

## 📦 هيكل البيانات المرسلة من الـ Frontend (Payload Format)

الواجهة تقوم بتجهيز البيانات عبر كائن `FormData` وإرسال الحقول التالية:

| اسم الحقل في FormData | النوع | إلزامي؟ | الوصف | مثال |
|---|---|---|---|---|
| `fullNameAr` | `string` | **نعم** | الاسم الكامل للطالب باللغة العربية | `أحمد محمد علي السالمي` |
| `fullNameEn` | `string` | لا | الاسم الكامل بالإنجليزي (للشهادات والجواز) | `Ahmed Mohammed Ali` |
| `phone` | `string` | **نعم** | رقم الجوال / الواتساب للتواصل | `771234567` |
| `courseId` | `string` | **نعم** | المعرف الفريد للدورة المختارة | `C001` |
| `courseTitle` | `string` | **نعم** | اسم الدورة التدريبية المختارة | `تطوير واجهات الويب الحديثة` |
| `birthDate` | `string (YYYY-MM-DD)` | لا | تاريخ ميلاد الطالب | `2001-05-14` |
| `birthPlace` | `string` | لا | مكان الميلاد / المدينة | `صنعاء` |
| `receiptFile` | `File (Binary)` | **نعم** | ملف صورة السند (`JPG, PNG`) أو مستند (`PDF`) | `receipt_payment.jpg` |

---

## 📥 هيكل الاستجابة المتوقع (Expected JSON Response)

### 1. في حالة النجاح (HTTP Status 200 OK أو 201 Created):

```json
{
  "success": true,
  "reference": "ITQ-2026-5821",
  "message": "تم استلام طلب التسجيل وسند السداد بنجاح",
  "timestamp": "27 أغسطس 2026 - 11:35 م",
  "data": {
    "referenceNumber": "ITQ-2026-5821",
    "studentName": "أحمد محمد علي السالمي",
    "phone": "771234567",
    "courseTitle": "تطوير واجهات الويب الحديثة",
    "submittedAt": "27 أغسطس 2026 - 11:35 م"
  }
}
```

### 2. في حالة الفشل أو خطأ في التحقق (HTTP Status 400 Bad Request):

```json
{
  "success": false,
  "message": "يرجى التحقق من صحة البيانات المرفوعة",
  "errors": {
    "phone": ["رقم الجوال مسجل مسبقاً في هذه الدورة"],
    "receiptFile": ["حجم الملف يتجاوز الحد المسموح به (5MB)"]
  }
}
```

---

## 🔌 كيفية تفعيل الـ API الحقيقي في الـ Frontend

ملف الـ API المعتمد هو: [`assets/js/utils/api.js`](../assets/js/utils/api.js)

عند بناء الـ Django Endpoint، يتم فقط استبدال محاكاة الـ Mock داخل دالة `submitRegistration` بالطلب الفعلي:

```javascript
// assets/js/utils/api.js
const Api = (() => {
  async function submitRegistration(formData) {
    const response = await fetch('/api/v1/registrations/', {
      method: 'POST',
      body: formData // يتم إرسال multipart/form-data تلقائياً
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'تعذر إرسال الطلب، يرجى المحاولة ثانية');
    }

    return await response.json();
  }

  return {
    submitRegistration
  };
})();
```

---

## 🐍 نموذج مقترح للـ Django (Suggested Model & View)

```python
# models.py
from django.db import models

class Registration(models.Model):
    reference_number = models.CharField(max_length=30, unique=True)
    full_name_ar = models.CharField(max_length=255)
    full_name_en = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=30)
    course_id = models.CharField(max_length=50)
    course_title = models.CharField(max_length=255)
    birth_date = models.DateField(null=True, blank=True)
    birth_place = models.CharField(max_length=150, blank=True)
    receipt_file = models.FileField(upload_to='receipts/%Y/%m/')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending') # pending, approved, rejected

    def __str__(self):
        return f"{self.reference_number} - {self.full_name_ar}"
```
