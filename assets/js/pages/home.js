/**
 * ITQAN — Home Page Controller
 * إدارة تفاعلات وعرض الصفحة الرئيسية
 */
const HomePage = (() => {
  let activeTrack = 'all';

  function init() {
    Navbar.render('navbar-container');
    Footer.render('footer-container');
    renderCourses();
    attachFilterEvents();

    if (window.Fatin && typeof window.Fatin.initSiteTour === 'function') {
      window.Fatin.initSiteTour();
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  function renderCourses() {
    const container = document.getElementById('courses-grid-container');
    if (!container || typeof CoursesData === 'undefined') return;

    const filtered = activeTrack === 'all'
      ? CoursesData
      : CoursesData.filter(c => c.trackKey === activeTrack);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--clr-surface); border-radius: var(--r-2xl); border: 1px solid var(--clr-border);">
          <div style="width: 56px; height: 56px; border-radius: var(--r-full); background: var(--clr-primary-light); color: var(--clr-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;">
            <i data-lucide="search" style="width: 24px; height: 24px;"></i>
          </div>
          <h4 style="font-size: var(--fs-lg); font-weight: var(--fw-bold); color: var(--clr-text); margin-bottom: 6px;">لا توجد دورات في هذا المسار حالياً</h4>
          <p style="font-size: var(--fs-sm); color: var(--clr-text-secondary);">يرجى اختيار مسار آخر أو تصفح كافة البرامج المتاحة.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const html = filtered.map(course => `
      <div class="course-card" data-track="${course.trackKey}">
        <div>
          <div class="course-card-top">
            <div class="course-icon-wrap" style="background: ${course.bgColor}; color: ${course.color};">
              <i data-lucide="${course.icon}"></i>
            </div>
            ${course.badge ? `
              <span class="course-badge" style="background: ${course.bgColor}; color: ${course.color};">
                ${course.badge}
              </span>
            ` : ''}
          </div>

          <span class="course-track-tag">${Helpers.escape(course.track)}</span>
          <h3 class="course-title">${Helpers.escape(course.title)}</h3>
          <p class="course-desc">${Helpers.escape(course.description)}</p>

          ${course.topics && course.topics.length ? `
            <ul class="course-topics-list" style="margin-bottom: var(--sp-5); padding-right: 0; list-style: none; display: flex; flex-direction: column; gap: 6px;">
              ${course.topics.map(topic => `
                <li style="display: flex; align-items: flex-start; gap: 8px; font-size: var(--fs-xs); color: var(--clr-text-secondary); line-height: 1.5;">
                  <i data-lucide="check-circle-2" style="width: 14px; height: 14px; color: ${course.color}; flex-shrink: 0; margin-top: 2px;"></i>
                  <span>${Helpers.escape(topic)}</span>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>

        <div>
          <div class="course-meta-row">
            <div class="course-meta-item">
              <i data-lucide="clock"></i>
              <span>${Helpers.escape(course.duration)}</span>
            </div>
            <div class="course-meta-item">
              <i data-lucide="award"></i>
              <span>${Helpers.escape(course.level)}</span>
            </div>
          </div>

          <div class="course-card-footer">
            <a href="register.html?course=${course.id}" class="btn-course-register">
              <span>سجل في هذه الدورة</span>
              <i data-lucide="arrow-left"></i>
            </a>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
    if (window.lucide) {
      lucide.createIcons({ root: container });
    }
  }

  function attachFilterEvents() {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', function() {
        chips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        activeTrack = this.getAttribute('data-track');
        renderCourses();

        const techLingoCard = document.getElementById('techlingo-card');
        if (techLingoCard) {
          techLingoCard.style.display = (activeTrack === 'all' || activeTrack === 'languages') ? 'flex' : 'none';
        }
      });
    });
  }

  return {
    init
  };
})();

document.addEventListener('DOMContentLoaded', HomePage.init);
