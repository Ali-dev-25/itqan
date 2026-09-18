/**
 * ITQAN — Public Navbar Component
 * الشريط العلوي المتجاوب للموقع التعريفي
 */
const Navbar = (() => {
  const NAV_LINKS = [
    { label: 'الرئيسية', id: 'hero' },
    { label: 'عن إتقان', id: 'about' },
    { label: 'البرامج والدورات', id: 'courses' },
    { label: 'خدماتنا البرمجية', id: 'services' },
    { label: 'المميزات', id: 'features' },
    { label: 'طريقة التسجيل', id: 'how-it-works' },
    { label: 'تواصل معنا', id: 'contact' },
  ];

  function isCurrentPageHome() {
    return Boolean(document.getElementById('hero'));
  }

  function render(containerId = 'navbar-container') {
    const el = document.getElementById(containerId);
    if (!el) return;

    const isHome = isCurrentPageHome();
    const prefix = isHome ? '#' : 'index.html#';
    const brandHref = isHome ? '#hero' : 'index.html';

    const linksHtml = NAV_LINKS.map((item, idx) => `
      <a href="${prefix}${item.id}" class="nav-item ${isHome && idx === 0 ? 'active' : ''}" data-target="${item.id}">
        ${item.label}
      </a>
    `).join('');

    const mobileLinksHtml = NAV_LINKS.map(item => `
      <a href="${prefix}${item.id}" class="mobile-nav-link" data-target="${item.id}">
        <span>${item.label}</span>
        <i data-lucide="chevron-left"></i>
      </a>
    `).join('');

    el.innerHTML = `
      <header class="public-navbar" id="public-navbar">
        <div class="container navbar-container">
          
          <!-- Logo & Brand -->
          <a href="${brandHref}" class="navbar-brand">
            ${Helpers.getLogoSVG({ size: 38, variant: 'navbar', withText: true })}
          </a>

          <!-- Desktop Navigation Menu -->
          <nav class="navbar-links" id="desktop-nav">
            ${linksHtml}
          </nav>

          <!-- Action Button -->
          <div class="navbar-actions">
            <a href="register.html" class="btn-nav-cta">
              <span>سجل الآن</span>
              <i data-lucide="arrow-left"></i>
            </a>

            <!-- Mobile Hamburger Toggle -->
            <button type="button" class="btn-mobile-toggle" id="btn-mobile-nav-toggle" aria-label="تبديل القائمة">
              <i data-lucide="menu" id="hamburger-icon"></i>
            </button>
          </div>

        </div>

        <!-- Mobile Drawer Menu -->
        <div class="mobile-drawer" id="mobile-drawer">
          <div class="mobile-drawer-header">
            <div class="mobile-brand">
              ${Helpers.getLogoSVG({ size: 34, variant: 'navbar', withText: true })}
            </div>
            <button type="button" class="btn-mobile-close" id="btn-mobile-nav-close" aria-label="إغلاق">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="mobile-drawer-body">
            ${mobileLinksHtml}
          </div>
          <div class="mobile-drawer-footer">
            <a href="register.html" class="btn-mobile-cta">
              <i data-lucide="user-plus"></i>
              <span>سجل في الدورات الآن</span>
            </a>
            <div class="mobile-drawer-socials">
              <a href="https://www.facebook.com/share/1DXH5xnmeG/" target="_blank" rel="noopener noreferrer" class="social-icon-btn social-facebook" aria-label="فيسبوك" title="صفحة فيسبوك">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/itqan.platform?stkn=dGd1cHpmb2F0NWRy" target="_blank" rel="noopener noreferrer" class="social-icon-btn social-instagram" aria-label="انستغرام" title="حساب انستغرام">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://whatsapp.com/channel/0029VbDLQh07T8bQmHMkqt2H" target="_blank" rel="noopener noreferrer" class="social-icon-btn social-whatsapp" aria-label="واتساب" title="قناة واتساب">
                <i data-lucide="message-circle"></i>
              </a>
              <a href="https://t.me/+2Rx3MF0sgLE1NWY8" target="_blank" rel="noopener noreferrer" class="social-icon-btn social-telegram" aria-label="تيليجرام" title="قناة تيليجرام">
                <i data-lucide="send"></i>
              </a>
            </div>
          </div>
        </div>
        <div class="mobile-overlay" id="mobile-overlay"></div>
      </header>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }

    initEvents();
  }

  function initEvents() {
    const navbar = document.getElementById('public-navbar');
    const toggleBtn = document.getElementById('btn-mobile-nav-toggle');
    const closeBtn = document.getElementById('btn-mobile-nav-close');
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-overlay');

    // Sticky Navbar shadow on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      updateActiveSection();
    });

    // Mobile drawer toggle
    function openDrawer() {
      drawer.classList.add('open');
      overlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      drawer.classList.remove('open');
      overlay.classList.remove('visible');
      document.body.style.overflow = '';
    }

    if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Smooth scroll for internal anchor links if target exists on the page
    document.querySelectorAll('a[href*="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) return;

        const hashIndex = href.indexOf('#');
        if (hashIndex === -1) return;

        const targetId = href.substring(hashIndex + 1);
        if (!targetId) return;

        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          // الهدف موجود في نفس الصفحة الحالية: تمرير سلس
          e.preventDefault();
          closeDrawer();
          if (window.Helpers && typeof window.Helpers.scrollToSection === 'function') {
            window.Helpers.scrollToSection(targetId);
          } else {
            const navH = navbar ? navbar.offsetHeight : 80;
            const pos = targetEl.getBoundingClientRect().top + window.pageYOffset - (navH + 12);
            window.scrollTo({ top: pos >= 0 ? pos : 0, behavior: 'smooth' });
          }
        } else {
          // الهدف في صفحة أخرى (مثل الانتقال من صفحة التسجيل للصفحة الرئيسية): إغلاق القائمة والسماح بالانتقال
          closeDrawer();
        }
      });
    });

    // التمرير التلقائي نحو القسم إذا تم فتح الصفحة مع هاش (Hash)
    if (window.location.hash) {
      setTimeout(() => {
        const hashId = window.location.hash.substring(1);
        if (document.getElementById(hashId) && window.Helpers && typeof window.Helpers.scrollToSection === 'function') {
          window.Helpers.scrollToSection(hashId);
        }
      }, 150);
    }
  }

  function updateActiveSection() {
    const isHome = isCurrentPageHome();
    if (!isHome) return;

    const scrollY = window.pageYOffset;
    const sections = document.querySelectorAll('section[id]');

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        document.querySelectorAll('.navbar-links .nav-item').forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('data-target') === sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  return {
    render
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navbar;
}
