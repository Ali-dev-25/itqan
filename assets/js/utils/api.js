/**
 * ITQAN — API Service Layer
 * طبقة التجريد للاتصال بالـ Django Backend API
 */
const Api = (() => {
  // تحديد الـ API Base URL تلقائياً (يعمل سواء تم تشغيل الـ Frontend عبر Django أو عبر خادم مستقل)
  const API_BASE_URL = window.location.origin.includes('8000')
    ? ''
    : 'http://127.0.0.1:8000';

  /**
   * إرسال طلب تسجيل طالب جديد مع المرفقات إلى سيرفر Django
   * @param {FormData} formData - يحتوي على بيانات الطالب وملف سند الدفع
   * @returns {Promise<Object>} - نتيجة معالجة الطلب مع الرقم المرجعي
   */
  async function submitRegistration(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/registrations/`, {
        method: 'POST',
        body: formData // يتم إرسال multipart/form-data تلقائياً
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        // استخراج رسائل الخطأ من الـ Backend
        let errorMessage = responseData.message || 'تعذر إرسال الطلب، يرجى مراجعة البيانات المدخلة';
        if (responseData.errors) {
          const firstKey = Object.keys(responseData.errors)[0];
          if (firstKey && Array.isArray(responseData.errors[firstKey])) {
            errorMessage = responseData.errors[firstKey][0];
          } else if (typeof responseData.errors === 'string') {
            errorMessage = responseData.errors;
          }
        }
        const error = new Error(errorMessage);
        error.data = responseData;
        throw error;
      }

      return responseData;
    } catch (err) {
      console.error('API submitRegistration error:', err);
      throw err;
    }
  }

  return {
    submitRegistration
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Api;
}
