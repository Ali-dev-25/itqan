/**
 * ITQAN — Public Navbar Component
 * الشريط العلوي المتجاوب للموقع التعريفي
 */
const Navbar = (() => {
  const NAV_LINKS = [
    { label: 'الرئيسية', href: '#hero', id: 'hero' },
    { label: 'عن إتقان', href: '#about', id: 'about' },
    { label: 'البرامج والدورات', href: '#courses', id: 'courses' },
    { label: 'المميزات', href: '#features', id: 'features' },
    { label: 'طريقة التسجيل', href: '#how-it-works', id: 'how-it-works' },
    { label: 'تواصل معنا', href: '#contact', id: 'contact' },
  ];

  function render(containerId = 'navbar-container') {
    const el = document.getElementById(containerId);
    if (!el) return;

    const linksHtml = NAV_LINKS.map((item, idx) => `
      <a href="${item.href}" class="nav-item ${idx === 0 ? 'active' : ''}" data-target="${item.id}">
        ${item.label}
      </a>
    `).join('');

    const mobileLinksHtml = NAV_LINKS.map(item => `
      <a href="${item.href}" class="mobile-nav-link" data-target="${item.id}">
        <span>${item.label}</span>
        <i data-lucide="chevron-left"></i>
      </a>
    `).join('');

    el.innerHTML = `
      <header class="public-navbar" id="public-navbar">
        <div class="container navbar-container">
          
          <!-- Logo & Brand -->
          <a href="#hero" class="navbar-brand">
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

    // Smooth scroll for all internal anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        const targetId = href.substring(1);
        if (targetId) {
          e.preventDefault();
          closeDrawer();
          if (window.Helpers && typeof window.Helpers.scrollToSection === 'function') {
            window.Helpers.scrollToSection(targetId);
          } else {
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
              const navH = navbar ? navbar.offsetHeight : 80;
              const pos = targetEl.getBoundingClientRect().top + window.pageYOffset - (navH + 12);
              window.scrollTo({ top: pos >= 0 ? pos : 0, behavior: 'smooth' });
            }
          }
        }
      });
    });
  }

  function updateActiveSection() {
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
