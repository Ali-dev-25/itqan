/**
 * ITQAN — Helper Utilities Module (V13 — Dual Responsive Logos)
 * دوال مساعدة عامة للشعار، التنسيق، وتجربة المستخدم
 */
const Helpers = (() => {
  /**
   * Generates the official Logo for Itqan platform
   * - Uses logo.png for navbar (light background with original dark navy 'i')
   * - Uses logo-footer.png for footer (dark background with crisp white 'i')
   * @param {Object} options - { size: 38, variant: 'navbar' | 'footer', withText: false }
   */
  function getLogoSVG(options = {}) {
    const {
      size = 38,
      variant = 'navbar',
      withText = false
    } = options;

    const textColor = variant === 'footer' ? '#FFFFFF' : '#1E293B';
    const subtextColor = variant === 'footer' ? '#94A3B8' : '#64748B';

    // اختيار النسخة المناسبة للون الخلفية (نافبار فاتح أو فوتر داكن)
    const logoSrc = variant === 'footer' ? 'assets/images/logo-footer.png?v=13' : 'assets/images/logo.png?v=13';

    const iconHtml = `
      <img src="${logoSrc}" alt="شعار منصة إتقان" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; object-fit: contain; flex-shrink: 0;" />
    `;

    if (!withText) return iconHtml;

    return `
      <div style="display: flex; align-items: center; gap: 12px;">
        ${iconHtml}
        <div style="display: flex; flex-direction: column; text-align: right;">
          <span style="font-size: 1.25rem; font-weight: 800; color: ${textColor}; line-height: 1.2; letter-spacing: -0.02em;">إتـقـان</span>
          <span style="font-size: 0.72rem; font-weight: 600; color: ${subtextColor};">للمحتوى التعليمي والتقني</span>
        </div>
      </div>
    `;
  }

  /**
   * Format currency numbers
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-YE', {
      style: 'currency',
      currency: 'YER',
      maximumFractionDigits: 0
    }).format(amount).replace('YER', 'ر.ي');
  }

  /**
   * Generates unique order reference ID (ITQ-XXXXXX)
   */
  function generateReferenceId() {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ITQ-${code}`;
  }

  /**
   * Formats ISO timestamp to human Arabic date
   */
  function formatArabicDate(dateStr) {
    try {
      const d = dateStr ? new Date(dateStr) : new Date();
      return new Intl.DateTimeFormat('ar-YE', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(d);
    } catch (e) {
      return dateStr || '';
    }
  }

  /**
   * Debounce helper
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Escape HTML special characters
   */
  function escape(str) {
    if (typeof str !== 'string') return str || '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Smoothly scroll to a section by ID with navbar offset
   */
  function scrollToSection(sectionId) {
    if (!sectionId) return;
    const cleanId = sectionId.startsWith('#') ? sectionId.substring(1) : sectionId;
    const el = document.getElementById(cleanId);
    if (!el) return;

    const navbar = document.getElementById('public-navbar') || document.querySelector('.public-navbar');
    const navHeight = navbar ? navbar.offsetHeight : 80;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - (navHeight + 12);

    window.scrollTo({
      top: offsetPosition >= 0 ? offsetPosition : 0,
      behavior: 'smooth'
    });
  }

  return {
    getLogoSVG,
    formatCurrency,
    generateReferenceId,
    formatArabicDate,
    debounce,
    escape,
    scrollToSection
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Helpers;
}
