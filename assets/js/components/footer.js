/**
 * ITQAN — Public Footer Component (V9 — Enhanced Social Links)
 * الترويسة السفلية الموحدة للموقع التعريفي
 */
const Footer = (() => {
  function render(containerId = 'footer-container') {
    const el = document.getElementById(containerId);
    if (!el) return;

    el.innerHTML = `
      <footer class="public-footer">
        <div class="container footer-container">
          
          <div class="footer-grid">
            
            <!-- Column 1: Brand & About -->
            <div class="footer-col footer-col-brand">
              <div class="footer-brand">
                ${Helpers.getLogoSVG({ size: 42, variant: 'footer', withText: true })}
              </div>
              <p class="footer-desc">
                منصة تعليمية وتدريبية رائدة متخصصة في تأهيل الكوادر التقنية والمهنية عبر برامج ودورات عملية تواكب متطلبات سوق العمل المعاصر.
              </p>
              <div class="footer-social-links">
                <!-- 1. فيسبوك -->
                <a href="https://www.facebook.com/share/1DXH5xnmeG/" target="_blank" rel="noopener noreferrer" class="social-icon-btn social-facebook" aria-label="فيسبوك" title="صفحة منصة إتقان على فيسبوك">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                
                <!-- 2. قناة واتساب -->
                <a href="https://whatsapp.com/channel/0029VbDLQh07T8bQmHMkqt2H" target="_blank" rel="noopener noreferrer" class="social-icon-btn social-whatsapp" aria-label="قناة الواتساب" title="قناة منصة إتقان على واتساب">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.115-.526-1.815-.751-2.985-2.597-3.076-2.717-.09-.121-.734-.977-.734-1.86 0-.884.464-1.32.63-1.498.167-.179.364-.224.486-.224.12 0 .241.002.346.007.11.005.257-.042.403.308.15.36.512 1.246.557 1.337.045.09.076.196.015.316-.06.12-.09.196-.18.301-.091.106-.192.237-.274.318-.091.091-.186.19-.08.373.106.183.47.775 1.011 1.256.697.62 1.284.812 1.467.903.182.09.289.076.395-.046.106-.12.454-.528.575-.709.12-.18.241-.15.405-.09.164.06 1.042.492 1.22.582.179.09.298.136.342.211.045.076.045.437-.099.842zM12 0C5.373 0 0 5.373 0 12c0 2.116.55 4.103 1.517 5.832L0 24l6.335-1.482A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.578-.506-5.068-1.385l-.364-.216-3.757.878.899-3.66-.236-.376A9.943 9.943 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
                  </svg>
                </a>

                <!-- 3. انستغرام -->
                <a href="https://www.instagram.com/itqan.platform?stkn=dGd1cHpmb2F0NWRy" target="_blank" rel="noopener noreferrer" class="social-icon-btn social-instagram" aria-label="انستغرام" title="حساب الانستغرام الرسمي">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                <!-- 4. قناة تيليجرام -->
                <a href="https://t.me/+2Rx3MF0sgLE1NWY8" target="_blank" rel="noopener noreferrer" class="social-icon-btn social-telegram" aria-label="قناة التيليجرام" title="قناة منصة إتقان على تيليجرام">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/>
                  </svg>
                </a>
              </div>
            </div>

            <!-- Column 2: Quick Links -->
            <div class="footer-col">
              <h4 class="footer-col-title">روابط سريعة</h4>
              <ul class="footer-links-list">
                <li><a href="index.html#hero"><i data-lucide="chevron-left"></i><span>الرئيسية</span></a></li>
                <li><a href="index.html#about"><i data-lucide="chevron-left"></i><span>عن إتقان</span></a></li>
                <li><a href="index.html#courses"><i data-lucide="chevron-left"></i><span>البرامج والدورات</span></a></li>
                <li><a href="index.html#services"><i data-lucide="chevron-left"></i><span>خدماتنا البرمجية</span></a></li>
                <li><a href="index.html#features"><i data-lucide="chevron-left"></i><span>مميزات المنصة</span></a></li>
                <li><a href="index.html#how-it-works"><i data-lucide="chevron-left"></i><span>طريقة التسجيل</span></a></li>
              </ul>
            </div>

            <!-- Column 3: Featured Tracks -->
            <div class="footer-col">
              <h4 class="footer-col-title">الدبلومات والبرامج التدريبية</h4>
              <ul class="footer-links-list">
                <li><a href="register.html?course=C001_CPP_BASICS"><i data-lucide="chevron-left"></i><span>دورة أساسيات البرمجة بلغة C++</span></a></li>
                <li><a href="register.html?course=C002_CPP_OOP"><i data-lucide="chevron-left"></i><span>دورة البرمجة كائنية التوجه C++ OOP</span></a></li>
                <li><a href="register.html?course=C003_PYTHON_BASICS"><i data-lucide="chevron-left"></i><span>دورة أساسيات لغة بايثون</span></a></li>
                <li><a href="register.html?course=C004_PYTHON_DESKTOP"><i data-lucide="chevron-left"></i><span>دورة تطبيقات سطح المكتب PyQt</span></a></li>
                <li><a href="register.html?course=C005_PYTHON_AI"><i data-lucide="chevron-left"></i><span>دورة الذكاء الاصطناعي وبايثون</span></a></li>
                <li><a href="register.html?course=C006_SQL"><i data-lucide="chevron-left"></i><span>دورة تصميم وقواعد البيانات SQL</span></a></li>
                <li><a href="register.html?course=C007_AI_PROMPT"><i data-lucide="chevron-left"></i><span>دورة تطبيقات الذكاء الاصطناعي</span></a></li>
                <li><a href="register.html?course=C008_TECHLINGO"><i data-lucide="chevron-left"></i><span>دبلوم إنجليزية الحاسوب TechLingo</span></a></li>
                <li><a href="register.html?course=C009_ICDL"><i data-lucide="chevron-left"></i><span>دبلوم رخصة قيادة الحاسوب ICDL</span></a></li>
              </ul>
            </div>

            <!-- Column 4: Contact & Register -->
            <div class="footer-col">
              <h4 class="footer-col-title">التسجيل وطلب المشاريع</h4>
              <p class="footer-subtext">
                التسجيل متاح في الدورات، كما نستقبل طلبات تطوير المواقع والأنظمة المخصصة.
              </p>
              <a href="register.html" class="btn-footer-cta">
                <i data-lucide="user-plus"></i>
                <span>سجل في الدورات الآن</span>
              </a>
              <div class="footer-contact-mini">
                <a href="https://wa.me/967771807595" target="_blank" rel="noopener noreferrer" class="footer-contact-item">
                  <i data-lucide="phone"></i>
                  <span dir="ltr">+967 771 807 595</span>
                </a>
                <a href="https://wa.me/967779958316" target="_blank" rel="noopener noreferrer" class="footer-contact-item">
                  <i data-lucide="phone"></i>
                  <span dir="ltr">+967 779 958 316</span>
                </a>
                <a href="https://whatsapp.com/channel/0029VbDLQh07T8bQmHMkqt2H" target="_blank" rel="noopener noreferrer" class="footer-contact-item" style="color: #4ADE80;">
                  <i data-lucide="message-circle"></i>
                  <span>قناة واتساب الرسمية</span>
                </a>
                <a href="https://t.me/+2Rx3MF0sgLE1NWY8" target="_blank" rel="noopener noreferrer" class="footer-contact-item" style="color: #38BDF8;">
                  <i data-lucide="send"></i>
                  <span>قناة تيليجرام الرسمية</span>
                </a>
                <a href="https://www.instagram.com/itqan.platform?stkn=dGd1cHpmb2F0NWRy" target="_blank" rel="noopener noreferrer" class="footer-contact-item" style="color: #F472B6;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>حساب انستغرام الرسمي</span>
                </a>
                <a href="https://www.facebook.com/share/1DXH5xnmeG/" target="_blank" rel="noopener noreferrer" class="footer-contact-item" style="color: #60A5FA;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>صفحة فيسبوك الرسمية</span>
                </a>
              </div>
            </div>

          </div>

          <!-- Bottom Copyright Bar -->
          <div class="footer-bottom-bar">
            <p class="copyright-text">
              جميع الحقوق محفوظة © <span id="copyright-year">2026</span> منصة «إتقان» للمحتوى التعليمي والتقني.
            </p>
            <div class="footer-bottom-links">
              <a href="javascript:void(0)">الشروط والأحكام</a>
              <span class="sep">•</span>
              <a href="javascript:void(0)">سياسة الخصوصية</a>
            </div>
          </div>

        </div>
      </footer>
    `;

    const yrEl = document.getElementById('copyright-year');
    if (yrEl) yrEl.textContent = new Date().getFullYear();

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  return {
    render
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Footer;
}
