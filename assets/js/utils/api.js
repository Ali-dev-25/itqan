/**
 * ITQAN — API Service Layer
 * طبقة التجريد للاتصال بالـ Django Backend API
 */
const Api = (() => {
  // تحديد الـ API Base URL تلقائياً (يعمل سواء تم تشغيل الـ Frontend عبر Django مباشرة على 8000/Render أو itqans.men أو عبر خادم مستقل مثل Live Server)
  const API_BASE_URL = (() => {
    if (typeof window === 'undefined') return '';
    const host = window.location.hostname;
    if (
      host === 'itqans.men' ||
      host.endsWith('.itqans.men') ||
      host.includes('onrender.com') ||
      host.includes('pythonanywhere.com') ||
      window.location.port === '8000'
    ) {
      return '';
    }
    return 'http://127.0.0.1:8000';
  })();

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

  /**
   * جلب إحصائيات عدد المسجلين الفعليين (المقبولين فقط) لكل دورة من السيرفر
   * يتضمن كسر التخزين المؤقت timestamp وحماية ضد الـ Cache لضمان التحديث الفوري
   * @returns {Promise<Object>} - خريطة بمعرفات الدورات وأعداد المسجلين
   */
  async function fetchRegistrationStats() {
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/api/v1/registrations/stats/?_t=${timestamp}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) return {};
      const data = await response.json();
      return data.stats || {};
    } catch (err) {
      console.warn('Live stats fetch warning:', err);
      return {};
    }
  }

  /**
   * قناة تواصل فورية بين كافة التبويبات المفتوحة للموقع
   */
  const broadcastChannel = (typeof window !== 'undefined' && window.BroadcastChannel)
    ? new BroadcastChannel('itqan_live_channel')
    : null;

  function notifyStatsUpdated() {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'STATS_UPDATED', timestamp: Date.now() });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('itqan:stats_updated', { detail: { timestamp: Date.now() } }));
    }
  }

  return {
    submitRegistration,
    fetchRegistrationStats,
    broadcastChannel,
    notifyStatsUpdated
  };
})();

// إتاحة الكائن عالمياً في نافذة المتصفح لمنع مشاكل النطاق في المتصفحات الحديثة
if (typeof window !== 'undefined') {
  window.Api = Api;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Api;
}