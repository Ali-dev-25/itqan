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

    // استثناء TechLingo من الشبكة العلوية لأن له بطاقة عرض متكاملة ومستقلة بالأسفل مباشرة
    const availableCourses = CoursesData.filter(c => c.id !== 'C005_TECHLINGO');

    const filtered = activeTrack === 'all'
      ? availableCourses
      : availableCourses.filter(c => {
          if (activeTrack === 'programming') return c.trackKey === 'programming';
          if (activeTrack === 'ai') return c.trackKey === 'ai' || (c.tracksOptions && c.tracksOptions.some(t => t.id === 'ai'));
          return c.trackKey === activeTrack;
        });

    if (filtered.length === 0) {
      if (activeTrack === 'languages') {
        // في حالة مسار اللغات، بطاقة TechLingo بالأسفل تكفي تماماً
        container.innerHTML = '';
        return;
      }
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

    const html = filtered.map(course => {
      const isDiploma = course.badge && course.badge.includes('دبلوم');
      const actionText = isDiploma ? 'سجل في هذا الدبلوم' : 'سجل في هذه الدورة';

      return `
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

          ${course.tracksOptions && course.tracksOptions.length ? `
            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--r-md); padding: 10px 14px; margin-bottom: var(--sp-4);">
              <div style="font-size: 0.74rem; font-weight: 700; color: #166534; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="git-branch" style="width: 13px; height: 13px; color: #10B981;"></i>
                <span>المساران التخصصيان المتاحان (يحدد الطالب أحدهما):</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 5px;">
                ${course.tracksOptions.map(t => `
                  <div style="font-size: 0.72rem; color: #15803D; display: flex; align-items: center; gap: 6px;">
                    <span style="width: 6px; height: 6px; background: #10B981; border-radius: 50%; flex-shrink: 0;"></span>
                    <span>${Helpers.escape(t.title)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

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
              <span>${actionText}</span>
              <i data-lucide="arrow-left"></i>
            </a>
          </div>
        </div>
      </div>
      `;
    }).join('');

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
