/**
 * ITQAN — Home Page Controller
 * إدارة تفاعلات وعرض الصفحة الرئيسية ونافذة مواضيع الدورات
 */
const HomePage = (() => {
  let activeTrack = 'all';

  function init() {
    Navbar.render('navbar-container');
    Footer.render('footer-container');
    renderCourses();
    attachFilterEvents();
    attachModalEvents();

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
            <div class="course-card-actions">
              <button type="button" class="btn-course-topics" data-course-id="${course.id}" title="عرض المحاور والمواضيع التفصيلية">
                <i data-lucide="list"></i>
                <span>مواضيع الدورة</span>
              </button>
              <a href="register.html?course=${course.id}" class="btn-course-register">
                <span>سجل الآن</span>
                <i data-lucide="arrow-left"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
    
    // ربط أحداث النقر على أزرار مواضيع الدورة
    container.querySelectorAll('.btn-course-topics').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const courseId = btn.getAttribute('data-course-id');
        openCourseTopicsModal(courseId);
      });
    });

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
      });
    });
  }

  /**
   * إنشاء وتهيئة نافذة مواضيع الدورة المنبثقة
   */
  function ensureTopicsModal() {
    let modal = document.getElementById('course-topics-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'course-topics-modal';
      modal.className = 'topics-modal-backdrop';
      modal.innerHTML = `
        <div class="topics-modal-card">
          <div class="topics-modal-header">
            <div class="topics-modal-title-wrap">
              <div class="topics-modal-icon" id="modal-course-icon-box">
                <i data-lucide="book-open" id="modal-course-icon"></i>
              </div>
              <div class="topics-modal-heading">
                <span id="modal-course-track">المسار التدريبي</span>
                <h3 id="modal-course-title">عنوان الدورة</h3>
              </div>
            </div>
            <button type="button" class="btn-close-topics-modal" id="btn-close-topics-modal" aria-label="إغلاق">
              <i data-lucide="x"></i>
            </button>
          </div>

          <div class="topics-modal-body">
            <div class="topics-modal-meta">
              <div class="topics-modal-meta-item">
                <i data-lucide="clock"></i>
                <span id="modal-course-duration">—</span>
              </div>
              <div class="topics-modal-meta-item">
                <i data-lucide="award"></i>
                <span id="modal-course-level">—</span>
              </div>
            </div>

            <div class="topics-list-title">
              <i data-lucide="check-circle-2" style="width: 16px; height: 16px; color: var(--clr-primary);"></i>
              <span>المحاور والمواضيع الرئيسية المعتمدة:</span>
            </div>

            <ul class="topics-list" id="modal-topics-list">
              <!-- Injected dynamically -->
            </ul>
          </div>

          <div class="topics-modal-footer">
            <button type="button" class="btn-modal-close-secondary" id="btn-modal-close-secondary">إغلاق</button>
            <a href="register.html" class="btn-modal-enroll" id="btn-modal-enroll">
              <span>سجل في هذه الدورة</span>
              <i data-lucide="arrow-left"></i>
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    return modal;
  }

  function openCourseTopicsModal(courseId) {
    const course = CoursesData.find(c => c.id === courseId);
    if (!course) return;

    const modal = ensureTopicsModal();

    // تعبئة بيانات الدورة في النافذة
    const iconBox = document.getElementById('modal-course-icon-box');
    if (iconBox) {
      iconBox.style.background = course.bgColor;
      iconBox.style.color = course.color;
      iconBox.innerHTML = `<i data-lucide="${course.icon}"></i>`;
    }

    const trackEl = document.getElementById('modal-course-track');
    if (trackEl) trackEl.textContent = course.track;

    const titleEl = document.getElementById('modal-course-title');
    if (titleEl) titleEl.textContent = course.title;

    const durationEl = document.getElementById('modal-course-duration');
    if (durationEl) durationEl.textContent = course.duration;

    const levelEl = document.getElementById('modal-course-level');
    if (levelEl) levelEl.textContent = course.level;

    const enrollBtn = document.getElementById('btn-modal-enroll');
    if (enrollBtn) {
      enrollBtn.href = `register.html?course=${course.id}`;
    }

    // توليد قائمة المحاور والمواضيع
    const listEl = document.getElementById('modal-topics-list');
    if (listEl) {
      if (course.topics && course.topics.length > 0) {
        listEl.innerHTML = course.topics.map((topic, index) => `
          <li class="topic-list-item">
            <span class="topic-num-badge">${index + 1}</span>
            <span>${Helpers.escape(topic)}</span>
          </li>
        `).join('');
      } else {
        listEl.innerHTML = `
          <li class="topic-list-item">
            <span>${Helpers.escape(course.description)}</span>
          </li>
        `;
      }
    }

    // فتح النافذة
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (window.lucide) {
      lucide.createIcons({ root: modal });
    }
  }

  function closeCourseTopicsModal() {
    const modal = document.getElementById('course-topics-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function attachModalEvents() {
    const modal = ensureTopicsModal();

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCourseTopicsModal();
      }
    });

    const closeBtn = document.getElementById('btn-close-topics-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeCourseTopicsModal);

    const closeSecondary = document.getElementById('btn-modal-close-secondary');
    if (closeSecondary) closeSecondary.addEventListener('click', closeCourseTopicsModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCourseTopicsModal();
      }
    });
  }

  return {
    init,
    openCourseTopicsModal,
    closeCourseTopicsModal
  };
})();

document.addEventListener('DOMContentLoaded', HomePage.init);
