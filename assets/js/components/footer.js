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
                <a href="javascript:void(0)" class="social-icon-btn" aria-label="فيسبوك" title="فيسبوك">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                
                <!-- 2. قناة واتساب -->
                <a href="https://whatsapp.com/channel/0029VbDLQh07T8bQmHMkqt2H" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="قناة الواتساب" title="قناة منصة إتقان على واتساب">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"></path>
                    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"></path>
                  </svg>
                </a>

                <!-- 3. انستغرام -->
                <a href="javascript:void(0)" class="social-icon-btn" aria-label="انستغرام" title="انستغرام">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>

                <!-- 4. قناة تيليجرام -->
                <a href="https://t.me/+2Rx3MF0sgLE1NWY8" target="_blank" rel="noopener noreferrer" class="social-icon-btn" aria-label="قناة التيليجرام" title="قناة منصة إتقان على تيليجرام">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </a>

                <!-- 5. لينكد إن -->
                <a href="javascript:void(0)" class="social-icon-btn" aria-label="لينكد إن" title="لينكد إن">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>

                <!-- 6. جيت هب -->
                <a href="javascript:void(0)" class="social-icon-btn" aria-label="جيت هب" title="جيت هب">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
              </div>
            </div>

            <!-- Column 2: Quick Links -->
            <div class="footer-col">
              <h4 class="footer-col-title">روابط سريعة</h4>
              <ul class="footer-links-list">
                <li><a href="#hero"><i data-lucide="chevron-left"></i><span>الرئيسية</span></a></li>
                <li><a href="#about"><i data-lucide="chevron-left"></i><span>عن إتقان</span></a></li>
                <li><a href="#courses"><i data-lucide="chevron-left"></i><span>البرامج والدورات</span></a></li>
                <li><a href="#features"><i data-lucide="chevron-left"></i><span>مميزات المنصة</span></a></li>
                <li><a href="#how-it-works"><i data-lucide="chevron-left"></i><span>طريقة التسجيل</span></a></li>
              </ul>
            </div>

            <!-- Column 3: Featured Tracks -->
            <div class="footer-col">
              <h4 class="footer-col-title">المسارات التدريبية</h4>
              <ul class="footer-links-list">
                <li><a href="register.html?course=C001"><i data-lucide="chevron-left"></i><span>دبلوم البرمجة بلغة C++</span></a></li>
                <li><a href="register.html?course=C002"><i data-lucide="chevron-left"></i><span>دبلوم بايثون والمسارات التخصصية</span></a></li>
                <li><a href="register.html?course=C003"><i data-lucide="chevron-left"></i><span>إنجليزية تخصصية للحاسوب (IT English)</span></a></li>
                <li><a href="register.html?course=C004"><i data-lucide="chevron-left"></i><span>استخدام نماذج الذكاء الاصطناعي</span></a></li>
              </ul>
            </div>

            <!-- Column 4: Contact & Register -->
            <div class="footer-col">
              <h4 class="footer-col-title">التسجيل والتواصل</h4>
              <p class="footer-subtext">
                باب التسجيل مفتوح الآن في كافة البرامج التدريبية المتاحة.
              </p>
              <a href="register.html" class="btn-footer-cta">
                <i data-lucide="user-plus"></i>
                <span>سجل في الدورات الآن</span>
              </a>
              <div class="footer-contact-mini">
                <a href="mailto:info@itqan-platform.com" class="footer-contact-item">
                  <i data-lucide="mail"></i>
                  <span>info@itqan-platform.com</span>
                </a>
                <a href="https://wa.me/967771807595" target="_blank" rel="noopener noreferrer" class="footer-contact-item">
                  <i data-lucide="phone"></i>
                  <span dir="ltr">+967 771 807 595</span>
                </a>
                <a href="https://whatsapp.com/channel/0029VbDLQh07T8bQmHMkqt2H" target="_blank" rel="noopener noreferrer" class="footer-contact-item" style="color: #4ADE80;">
                  <i data-lucide="message-circle"></i>
                  <span>قناة واتساب الرسمية</span>
                </a>
                <a href="https://t.me/+2Rx3MF0sgLE1NWY8" target="_blank" rel="noopener noreferrer" class="footer-contact-item" style="color: #38BDF8;">
                  <i data-lucide="send"></i>
                  <span>قناة تيليجرام الرسمية</span>
                </a>
              </div>
            </div>

          </div>

          <!-- Bottom Copyright Bar -->
          <div class="footer-bottom-bar">
            <p class="copyright-text">
              جميع الحقوق محفوظة © <span id="copyright-year">2026</span> منصة «إتقان» للمحتوى التقني التعليمي.
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
