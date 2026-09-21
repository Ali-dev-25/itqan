/**
 * ITQAN — Home Page Controller
 * إدارة تفاعلات وعرض الصفحة الرئيسية مع إحصائيات سعة الدورات والتسجيل
 */
const HomePage = (() => {
  let activeTrack = 'all';
  let liveStats = {};
  let pollingTimer = null;

  async function init() {
    Navbar.render('navbar-container');
    Footer.render('footer-container');

    // 1. تحميل وتحديث الدورات التدريبية المعتمدة من السيرفر (الحالة ونمطي الحضور والدورات الجديدة)
    await loadDynamicCourses();

    // 2. بناء وعرض بطاقات الدورات بالهوية المعتمدة
    renderCourses();
    attachFilterEvents();

    if (window.Fatin && typeof window.Fatin.initSiteTour === 'function') {
      window.Fatin.initSiteTour();
    }

    if (window.lucide) {
      lucide.createIcons();
    }

    // جلب فوري للإحصائيات عند بدء التحميل
    await syncLiveStats();

    // تشغيل المزامنة الدورية الحية (Live Auto-Polling) كل 3 ثوانٍ
    startLivePolling();

    // المزامنة الفورية بمجرد عودة المستخدم لتبويب المتصفح
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        syncLiveStats();
      }
    });

    window.addEventListener('focus', () => {
      syncLiveStats();
    });

    // الاستماع لقنوات البث والتحديثات الفورية بين التبويبات
    const api = getApi();
    if (api && api.broadcastChannel) {
      api.broadcastChannel.onmessage = (e) => {
        if (e.data && e.data.type === 'STATS_UPDATED') {
          syncLiveStats();
        }
      };
    }
    window.addEventListener('itqan:stats_updated', () => {
      syncLiveStats();
    });
  }

  function getApi() {
    if (typeof window !== 'undefined' && window.Api) return window.Api;
    if (typeof Api !== 'undefined') return Api;
    return null;
  }

  /**
   * جلب بيانات الدورات المحدثة من السيرفر ومزامنتها محلياً
   */
  async function loadDynamicCourses() {
    const api = getApi();
    if (!api || typeof api.fetchCourses !== 'function') return;
    try {
      const dbCourses = await api.fetchCourses();
      if (Array.isArray(dbCourses) && dbCourses.length > 0) {
        mergeCoursesWithDB(dbCourses);
      }
    } catch (e) {
      console.warn('Could not load dynamic courses:', e);
    }
  }

  /**
   * دمج الدورات القادمة من قاعدة البيانات مع مصفوفة الدورات
   */
  function mergeCoursesWithDB(dbCourses) {
    if (typeof CoursesData === 'undefined') return;

    dbCourses.forEach(dbCourse => {
      const cid = dbCourse.id || dbCourse.course_id;
      const existing = CoursesData.find(c => c.id === cid);
      if (existing) {
        existing.status = dbCourse.status || 'active';
        existing.allowInPerson = dbCourse.allowInPerson !== false;
        existing.allowOnline = dbCourse.allowOnline !== false;
        if (dbCourse.title) existing.title = dbCourse.title;
        if (dbCourse.description) existing.description = dbCourse.description;
        if (dbCourse.badge) existing.badge = dbCourse.badge;
        if (dbCourse.minStudents) existing.minStudents = dbCourse.minStudents;
        if (dbCourse.maxStudents) existing.maxStudents = dbCourse.maxStudents;
        if (dbCourse.topicsList && dbCourse.topicsList.length) existing.topics = dbCourse.topicsList;
        if (dbCourse.pricing && existing.pricing) {
          if (existing.pricing.inPerson && dbCourse.pricing.inPerson) {
            existing.pricing.inPerson.current = dbCourse.pricing.inPerson.current;
            existing.pricing.inPerson.original = dbCourse.pricing.inPerson.original;
          }
          if (existing.pricing.online && dbCourse.pricing.online) {
            existing.pricing.online.current = dbCourse.pricing.online.current;
            existing.pricing.online.original = dbCourse.pricing.online.original;
          }
        }
      } else {
        // دورة تدريبية جديدة تمت إضافتها عبر لوحة التحكم!
        CoursesData.push({
          id: cid,
          title: dbCourse.title,
          track: dbCourse.track || 'برامج تدريبية تخصصية',
          trackKey: dbCourse.trackKey || 'programming',
          description: dbCourse.description || '',
          duration: dbCourse.duration || 'شهر تدريبي (40 ساعة تدريبية)',
          level: dbCourse.level || 'من الصفر والمبتدئين',
          badge: dbCourse.badge || 'دورة جديدة',
          icon: dbCourse.icon || 'book-open',
          color: dbCourse.color || '#2563EB',
          bgColor: dbCourse.bgColor || '#EFF6FF',
          status: dbCourse.status || 'active',
          allowInPerson: dbCourse.allowInPerson !== false,
          allowOnline: dbCourse.allowOnline !== false,
          minStudents: dbCourse.minStudents || 15,
          maxStudents: dbCourse.maxStudents || 30,
          featured: dbCourse.featured !== false,
          prerequisite: dbCourse.prerequisite || '',
          laptopRequired: !!dbCourse.laptopRequired,
          topics: dbCourse.topicsList || [],
          pricing: dbCourse.pricing || {
            type: 'standard',
            inPerson: { current: 20000, original: 25000, label: 'حضوري بالمقر' },
            online: { current: 15000, original: 20000, label: 'أونلاين (Online)' },
            certificate: 'شاملة الشهادة المعتمدة'
          }
        });
      }
    });
  }

  async function syncLiveStats() {
    const api = getApi();
    if (!api || typeof api.fetchRegistrationStats !== 'function') return;
    try {
      const responseData = await api.fetchRegistrationStats();
      if (responseData && typeof responseData === 'object') {
        // فحص التحديثات اللحظية لحالة الدورات وخيارات الحضور المنقولة مع الـ stats
        if (responseData.config && typeof responseData.config === 'object' && typeof CoursesData !== 'undefined') {
          let hasConfigChange = false;
          Object.entries(responseData.config).forEach(([cid, cfg]) => {
            const course = CoursesData.find(c => c.id === cid);
            if (course) {
              const prevStatus = course.status;
              const prevInPerson = course.allowInPerson;
              const prevOnline = course.allowOnline;
              if (prevStatus !== cfg.status || prevInPerson !== cfg.allow_in_person || prevOnline !== cfg.allow_online) {
                course.status = cfg.status;
                course.allowInPerson = cfg.allow_in_person;
                course.allowOnline = cfg.allow_online;
                hasConfigChange = true;
              }
            }
          });
          if (hasConfigChange) {
            renderCourses();
          }
        }
        updateDynamicCapacityDOM(responseData);
      }
    } catch (e) {
      // الاستمرار بهدوء في حال تعذر الاتصال المؤقت
    }
  }

  function startLivePolling() {
    if (pollingTimer) clearInterval(pollingTimer);
    pollingTimer = setInterval(() => {
      syncLiveStats();
    }, 3000);
  }

  function updateDynamicCapacityDOM(newStats) {
    if (typeof CoursesData === 'undefined') return;

    CoursesData.forEach(course => {
      const inPerson = (newStats && typeof newStats[`${course.id}_in_person`] === 'number')
        ? newStats[`${course.id}_in_person`]
        : (newStats?.breakdown?.[course.id]?.in_person || 0);

      const online = (newStats && typeof newStats[`${course.id}_online`] === 'number')
        ? newStats[`${course.id}_online`]
        : (newStats?.breakdown?.[course.id]?.online || 0);

      const newCount = (newStats && typeof newStats[course.id] === 'number')
        ? newStats[course.id]
        : (inPerson + online);

      const card = document.getElementById(`capacity-card-${course.id}`);
      
      if (card) {
        const min = course.minStudents || 15;
        const max = course.maxStudents || 30;
        const isConfirmed = newCount >= min;
        const remainingToMin = Math.max(0, min - newCount);

        const percentInPerson = Math.min(100, Math.round((inPerson / max) * 100));
        const percentOnline = Math.min(100, Math.round((online / max) * 100));
        const displayInPerson = inPerson > 0 ? Math.max(5, percentInPerson) : 0;
        const displayOnline = online > 0 ? Math.max(5, percentOnline) : 0;

        const countEl = card.querySelector('.enrolled-count');
        if (countEl) {
          if (countEl.textContent !== String(newCount)) {
            countEl.textContent = newCount;
            countEl.classList.remove('is-updated');
            void countEl.offsetWidth; // trigger reflow for smooth pulse animation
            countEl.classList.add('is-updated');
          }
        }

        // تحديث أعداد ونسب الحضوري
        const inPersonCountEl = card.querySelector('.count-val-inperson');
        if (inPersonCountEl) inPersonCountEl.textContent = inPerson;
        const inPersonPercentEl = card.querySelector('.percent-val-inperson');
        if (inPersonPercentEl) inPersonPercentEl.textContent = `(${percentInPerson}%)`;
        const fillInPersonEl = card.querySelector('.fill-inperson');
        if (fillInPersonEl) fillInPersonEl.style.width = `${displayInPerson}%`;

        // تحديث أعداد ونسب الأونلاين (عن بعد)
        const onlineCountEl = card.querySelector('.count-val-online');
        if (onlineCountEl) onlineCountEl.textContent = online;
        const onlinePercentEl = card.querySelector('.percent-val-online');
        if (onlinePercentEl) onlinePercentEl.textContent = `(${percentOnline}%)`;
        const fillOnlineEl = card.querySelector('.fill-online');
        if (fillOnlineEl) fillOnlineEl.style.width = `${displayOnline}%`;

        const badgeWrap = card.querySelector('.capacity-badge-wrap');
        if (badgeWrap) {
          const newBadgeHTML = isConfirmed
            ? `<span class="capacity-status-badge confirmed"><i data-lucide="check-circle" style="width: 11px; height: 11px;"></i> مؤكدة</span>`
            : `<span class="capacity-status-badge enrolling"><i data-lucide="clock" style="width: 11px; height: 11px;"></i> متبقي ${remainingToMin}</span>`;
          
          if (badgeWrap.innerHTML.trim() !== newBadgeHTML.trim()) {
            badgeWrap.innerHTML = newBadgeHTML;
            if (window.lucide) {
              lucide.createIcons({ root: badgeWrap });
            }
          }
        }
      }
    });

    liveStats = { ...newStats };

    // تحديث أشرطة السعة لمستويات TechLingo الـ 6 مباشرة مع دعم تأثيرات النبض
    TECHLINGO_LEVELS.forEach(lvl => {
      const levelId = `C008_TECHLINGO_${lvl}`;
      const newCount = (newStats && typeof newStats[levelId] === 'number') ? newStats[levelId] : 0;
      const card = document.getElementById(`capacity-card-${levelId}`);
      if (card) {
        const min = 15;
        const max = 30;
        const percent = Math.min(100, Math.round((newCount / max) * 100));
        const displayPercent = newCount > 0 ? Math.max(8, percent) : 0;
        const isConfirmed = newCount >= min;
        const remainingToMin = Math.max(0, min - newCount);

        const countEl = card.querySelector('.enrolled-count');
        if (countEl && countEl.textContent !== String(newCount)) {
          countEl.textContent = newCount;
          countEl.classList.remove('is-updated');
          void countEl.offsetWidth;
          countEl.classList.add('is-updated');
        }

        const fillEl = card.querySelector('.capacity-progress-fill');
        if (fillEl) {
          fillEl.style.width = `${displayPercent}%`;
          if (isConfirmed) {
            fillEl.classList.add('is-confirmed');
          } else {
            fillEl.classList.remove('is-confirmed');
          }
        }

        const badgeWrap = card.querySelector('.capacity-badge-wrap');
        if (badgeWrap) {
          const newBadgeHTML = isConfirmed
            ? `<span class="capacity-status-badge confirmed"><i data-lucide="check-circle" style="width: 10px; height: 10px;"></i> مؤكدة</span>`
            : `<span class="capacity-status-badge enrolling"><i data-lucide="clock" style="width: 10px; height: 10px;"></i> متبقي ${remainingToMin}</span>`;
          if (badgeWrap.innerHTML.trim() !== newBadgeHTML.trim()) {
            badgeWrap.innerHTML = newBadgeHTML;
            if (window.lucide) {
              lucide.createIcons({ root: badgeWrap });
            }
          }
        }
      } else {
        const lvlContainer = document.getElementById(`level-capacity-container-${lvl}`);
        if (lvlContainer) {
          lvlContainer.innerHTML = getLevelCapacityHTML(lvl);
          if (window.lucide) lucide.createIcons({ root: lvlContainer });
        }
      }
    });
  }

  function getCoursePriceHTML(course) {
    if (!course.pricing) return '';

    const allowInPerson = course.allowInPerson !== false;
    const allowOnline = course.allowOnline !== false;

    if (course.pricing.type === 'standard') {
      const inP = course.pricing.inPerson || { current: 20000, original: 25000 };
      const onL = course.pricing.online || { current: 15000, original: 20000 };

      let pillsHtml = '';
      if (allowInPerson && allowOnline) {
        pillsHtml = `
            <div class="price-pill in-person">
              <span class="price-pill-lbl">حضوري بالمقر</span>
              <div class="price-pill-nums">
                <span class="price-curr">${Helpers.formatCurrency(inP.current)}</span>
                ${inP.original > inP.current ? `<del class="price-orig">${Helpers.formatCurrency(inP.original)}</del>` : ''}
              </div>
            </div>
            <div class="price-pill online">
              <span class="price-pill-lbl">أونلاين (Online)</span>
              <div class="price-pill-nums">
                <span class="price-curr">${Helpers.formatCurrency(onL.current)}</span>
                ${onL.original > onL.current ? `<del class="price-orig">${Helpers.formatCurrency(onL.original)}</del>` : ''}
              </div>
            </div>
        `;
      } else if (allowInPerson && !allowOnline) {
        pillsHtml = `
            <div class="price-pill in-person" style="flex: 1;">
              <span class="price-pill-lbl">حضوري بالمقر (متاح بالمقر فقط)</span>
              <div class="price-pill-nums">
                <span class="price-curr">${Helpers.formatCurrency(inP.current)}</span>
                ${inP.original > inP.current ? `<del class="price-orig">${Helpers.formatCurrency(inP.original)}</del>` : ''}
              </div>
            </div>
        `;
      } else if (!allowInPerson && allowOnline) {
        pillsHtml = `
            <div class="price-pill online" style="flex: 1;">
              <span class="price-pill-lbl">أونلاين (متاح عن بعد فقط)</span>
              <div class="price-pill-nums">
                <span class="price-curr">${Helpers.formatCurrency(onL.current)}</span>
                ${onL.original > onL.current ? `<del class="price-orig">${Helpers.formatCurrency(onL.original)}</del>` : ''}
              </div>
            </div>
        `;
      } else {
        pillsHtml = `
            <div class="price-pill" style="flex: 1; background: #FEE2E2; border-color: #FCA5A5; color: #991B1B;">
              <span class="price-pill-lbl" style="color: #991B1B;">التسجيل معلق حالياً لكافة الأنماط</span>
            </div>
        `;
      }

      return `
        <div class="course-price-card">
          <div class="price-pills-row">
            ${pillsHtml}
          </div>
          <div class="price-cert-badge">
            <i data-lucide="award"></i>
            <span>${course.pricing.certificate || 'شاملة الشهادة المعتمدة'}</span>
          </div>
        </div>
      `;
    }

    if (course.pricing.type === 'phases') {
      const p1 = course.pricing.phase1;
      const p2 = course.pricing.phase2;
      return `
        <div class="course-price-card">
          <div class="price-phases-list">
            <div class="price-phase-row">
              <div class="phase-title">📌 ${p1.name}:</div>
              <div class="phase-nums">
                <span>حضوري: <strong>${Helpers.formatCurrency(p1.inPerson.current)}</strong> <del>${Helpers.formatCurrency(p1.inPerson.original)}</del></span>
                <span class="phase-sep">•</span>
                <span>أونلاين: <strong>${Helpers.formatCurrency(p1.online.current)}</strong> <del>${Helpers.formatCurrency(p1.online.original)}</del></span>
              </div>
            </div>
            <div class="price-phase-row">
              <div class="phase-title">📌 ${p2.name}:</div>
              <div class="phase-nums">
                <span>حضوري: <strong>${Helpers.formatCurrency(p2.inPerson.current)}</strong> <del>${Helpers.formatCurrency(p2.inPerson.original)}</del></span>
                <span class="phase-sep">•</span>
                <span>أونلاين: <strong>${Helpers.formatCurrency(p2.online.current)}</strong></span>
              </div>
            </div>
          </div>
          <div class="price-cert-badge">
            <i data-lucide="award"></i>
            <span>${course.pricing.certificate || 'شاملة الشهادة المعتمدة'}</span>
          </div>
        </div>
      `;
    }

    if (course.pricing.type === 'flat') {
      const hasOriginal = course.pricing.original && course.pricing.original > course.pricing.amount;
      const pillBg = course.bgColor || '#FFFBEB';
      const pillBorder = course.color ? `${course.color}35` : '#FDE68A';
      const currColor = course.color || '#D97706';

      return `
        <div class="course-price-card">
          <div class="price-pills-row">
            <div class="price-pill flat-pill" style="background: ${pillBg}; border-color: ${pillBorder};">
              <span class="price-pill-lbl">${course.pricing.label || 'رسوم الدورة (حضوري أو Online)'}</span>
              <div class="price-pill-nums">
                <span class="price-curr" style="color: ${currColor}; font-weight: 800;">${Helpers.formatCurrency(course.pricing.amount)}</span>
                ${hasOriginal ? `<del class="price-orig">${Helpers.formatCurrency(course.pricing.original)}</del>` : '<span style="font-size: 0.72rem; color: var(--clr-text-secondary);">فقط</span>'}
              </div>
            </div>
          </div>
          <div class="price-cert-badge">
            <i data-lucide="award"></i>
            <span>${course.pricing.certificate || 'شاملة الشهادة المعتمدة'}</span>
          </div>
        </div>
      `;
    }

    return '';
  }

  /**
   * عنصر عرض سعة الدورة والمقاعد المسجلة الفعّلية (المقبولة من الأدمن)
   */
  function getCourseCapacityHTML(course) {
    const min = course.minStudents || 15;
    const max = course.maxStudents || 30;

    const inPerson = (liveStats && typeof liveStats[`${course.id}_in_person`] === 'number')
      ? liveStats[`${course.id}_in_person`]
      : (liveStats?.breakdown?.[course.id]?.in_person || 0);

    const online = (liveStats && typeof liveStats[`${course.id}_online`] === 'number')
      ? liveStats[`${course.id}_online`]
      : (liveStats?.breakdown?.[course.id]?.online || 0);

    const enrolled = (liveStats && typeof liveStats[course.id] === 'number')
      ? liveStats[course.id]
      : (inPerson + online);

    const percentInPerson = Math.min(100, Math.round((inPerson / max) * 100));
    const percentOnline = Math.min(100, Math.round((online / max) * 100));
    const displayInPerson = inPerson > 0 ? Math.max(5, percentInPerson) : 0;
    const displayOnline = online > 0 ? Math.max(5, percentOnline) : 0;

    const isConfirmed = enrolled >= min;
    const remainingToMin = Math.max(0, min - enrolled);

    const allowInPerson = course.allowInPerson !== false;
    const allowOnline = course.allowOnline !== false;

    const statusBadge = isConfirmed
      ? `<span class="capacity-status-badge confirmed"><i data-lucide="check-circle" style="width: 11px; height: 11px;"></i> مؤكدة</span>`
      : `<span class="capacity-status-badge enrolling"><i data-lucide="clock" style="width: 11px; height: 11px;"></i> متبقي ${remainingToMin}</span>`;

    let rowsHtml = '';
    if (allowInPerson) {
      rowsHtml += `
          <div class="capacity-mode-row inperson-mode-row">
            <div class="capacity-mode-info">
              <span class="capacity-mode-label">
                <i data-lucide="map-pin" class="icon-inperson"></i>
                <span>حضوري:</span>
              </span>
              <span class="capacity-mode-count"><strong class="count-val-inperson count-inperson">${inPerson}</strong> طالب <span class="percent-val-inperson mode-percent">(${percentInPerson}%)</span></span>
            </div>
            <div class="capacity-progress-bar-wrap mode-bar inperson" title="المسجلون حضورياً: ${inPerson} طالب">
              <div class="capacity-progress-fill fill-inperson" style="width: ${displayInPerson}%;"></div>
            </div>
          </div>
      `;
    }

    if (allowOnline) {
      rowsHtml += `
          <div class="capacity-mode-row online-mode-row">
            <div class="capacity-mode-info">
              <span class="capacity-mode-label">
                <i data-lucide="globe" class="icon-online"></i>
                <span>أونلاين:</span>
              </span>
              <span class="capacity-mode-count"><strong class="count-val-online count-online">${online}</strong> طالب <span class="percent-val-online mode-percent">(${percentOnline}%)</span></span>
            </div>
            <div class="capacity-progress-bar-wrap mode-bar online" title="المسجلون أونلاين: ${online} طالب">
              <div class="capacity-progress-fill fill-online" style="width: ${displayOnline}%;"></div>
            </div>
          </div>
      `;
    }

    return `
      <div class="course-capacity-card" id="capacity-card-${course.id}" data-course-id="${course.id}">
        <div class="capacity-header">
          <div class="capacity-enrolled-wrap">
            <i data-lucide="users"></i>
            <span>المسجلون (المقبولون): <strong class="enrolled-count">${enrolled}</strong> طالب</span>
          </div>
          <div class="capacity-badge-wrap">
            ${statusBadge}
          </div>
        </div>

        <div class="capacity-dual-bars">
          ${rowsHtml}
        </div>

        <div class="capacity-footer-meta">
          <div class="capacity-meta-item">
            <i data-lucide="target" style="width: 11px; height: 11px; color: var(--clr-primary);"></i>
            <span>الحد الأدنى: <strong>${min} طالب</strong></span>
          </div>
          <div class="capacity-meta-item">
            <i data-lucide="user-check" style="width: 11px; height: 11px; color: var(--clr-text-muted);"></i>
            <span>السعة: <strong>${max} مقعد</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  const TECHLINGO_LEVELS = ['1A', '1B', '2A', '2B', '3A', '3B'];

  /**
   * عنصر عرض سعة مقاعد مستوى محدد من دبلوم اللغة الإنجليزية TechLingo
   */
  function getLevelCapacityHTML(levelCode) {
    const levelId = `C008_TECHLINGO_${levelCode}`;
    const min = 15;
    const max = 30;
    const enrolled = (liveStats && typeof liveStats[levelId] === 'number') ? liveStats[levelId] : 0;
    const percent = Math.min(100, Math.round((enrolled / max) * 100));
    const displayPercent = enrolled > 0 ? Math.max(8, percent) : 0;
    const isConfirmed = enrolled >= min;
    const remainingToMin = Math.max(0, min - enrolled);

    const statusBadge = isConfirmed
      ? `<span class="capacity-status-badge confirmed"><i data-lucide="check-circle" style="width: 10px; height: 10px;"></i> مؤكدة</span>`
      : `<span class="capacity-status-badge enrolling"><i data-lucide="clock" style="width: 10px; height: 10px;"></i> متبقي ${remainingToMin}</span>`;

    return `
      <div class="course-capacity-card techlingo-level-capacity-card" id="capacity-card-${levelId}" data-course-id="${levelId}">
        <div class="capacity-header">
          <div class="capacity-enrolled-wrap">
            <i data-lucide="users" style="width: 13px; height: 13px;"></i>
            <span>المقبولون: <strong class="enrolled-count">${enrolled}</strong> طالب</span>
          </div>
          <div class="capacity-badge-wrap">
            ${statusBadge}
          </div>
        </div>
        <div class="capacity-progress-bar-wrap" title="نسبة المقبولين في المستوى ${levelCode}: ${percent}%">
          <div class="capacity-progress-fill ${isConfirmed ? 'is-confirmed' : ''}" style="width: ${displayPercent}%;"></div>
        </div>
        <div class="capacity-footer-meta">
          <div class="capacity-meta-item">
            <span>الحد الأدنى: <strong>${min}</strong></span>
          </div>
          <div class="capacity-meta-item">
            <span>السعة: <strong>${max}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  function updateTechLingoCapacity() {
    // أشرطة السعة المستقلة أسفل كل مستوى من مستويات دبلوم اللغة الإنجليزية الـ 6
    TECHLINGO_LEVELS.forEach(lvl => {
      const lvlContainer = document.getElementById(`level-capacity-container-${lvl}`);
      if (lvlContainer) {
        lvlContainer.innerHTML = getLevelCapacityHTML(lvl);
        if (window.lucide) {
          lucide.createIcons({ root: lvlContainer });
        }
      }
    });
  }

  function renderCourses() {
    updateTechLingoCapacity();

    const container = document.getElementById('courses-grid-container');
    if (!container || typeof CoursesData === 'undefined') return;

    // استثناء TechLingo من الشبكة العلوية لأن له بطاقة عرض متكاملة ومستقلة بالأسفل مباشرة
    const availableCourses = CoursesData.filter(c => !c.id.includes('TECHLINGO'));

    const filtered = activeTrack === 'all'
      ? availableCourses
      : availableCourses.filter(c => {
          if (activeTrack === 'programming') return c.trackKey === 'programming';
          if (activeTrack === 'ai') return c.trackKey === 'ai' || (c.tracksOptions && c.tracksOptions.some(t => t.id === 'ai'));
          if (activeTrack === 'languages') return c.trackKey === 'languages' || c.trackKey === 'skills';
          return c.trackKey === activeTrack;
        });

    if (filtered.length === 0) {
      if (activeTrack === 'languages') {
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
      const isSuspended = course.status === 'suspended';
      const isDiploma = course.badge && course.badge.includes('دبلوم');
      const actionText = isDiploma ? 'سجل في هذا الدبلوم' : 'سجل في هذه الدورة';

      return `
      <div class="course-card ${isSuspended ? 'is-suspended' : ''}" data-track="${course.trackKey}">
        <div>
          ${isSuspended ? `
            <div class="course-suspended-banner">
              <i data-lucide="pause-circle"></i>
              <span>التسجيل في هذه الدورة موقف حالياً</span>
            </div>
          ` : ''}

          <div class="course-card-top">
            <div class="course-icon-wrap" style="background: ${course.bgColor}; color: ${course.color};">
              <i data-lucide="${course.icon}"></i>
            </div>
            <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
              ${isSuspended ? `
                <span class="course-badge is-suspended-badge">
                  ⏸️ موقفة حالياً
                </span>
              ` : ''}
              ${course.badge ? `
                <span class="course-badge" style="background: ${course.bgColor}; color: ${course.color};">
                  ${course.badge}
                </span>
              ` : ''}
            </div>
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

          ${course.durationDetails ? `
            <div style="background: var(--clr-surface-alt, #F8FAFC); border: 1px solid var(--clr-border, #E2E8F0); border-radius: var(--r-md); padding: 9px 13px; margin-bottom: var(--sp-4); display: flex; flex-direction: column; gap: 4px;">
              <div style="font-size: 0.73rem; font-weight: 700; color: ${course.color}; display: flex; align-items: center; gap: 5px;">
                <i data-lucide="calendar-clock" style="width: 13px; height: 13px;"></i>
                <span>تفصيل الخطة الزمنية:</span>
              </div>
              <div style="font-size: 0.71rem; color: var(--clr-text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: ${course.color}; flex-shrink: 0;"></span>
                <span>${Helpers.escape(course.durationDetails.part1)}</span>
              </div>
              <div style="font-size: 0.71rem; color: var(--clr-text-secondary); display: flex; align-items: center; gap: 6px;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: ${course.color}; flex-shrink: 0;"></span>
                <span>${Helpers.escape(course.durationDetails.part2)}</span>
              </div>
            </div>
          ` : ''}

          ${course.laptopRequired ? `
            <div class="course-laptop-badge">
              <i data-lucide="laptop"></i>
              <span>ملاحظة هامة: يشترط إحضار لابتوب خاص بالطالب للتطبيق العملي.</span>
            </div>
          ` : ''}

          ${course.prerequisite && !course.laptopRequired ? `
            <div class="course-prerequisite-box">
              <i data-lucide="alert-circle"></i>
              <span>${Helpers.escape(course.prerequisite)}</span>
            </div>
          ` : ''}

          <!-- Price & Certification Box -->
          ${getCoursePriceHTML(course)}

          <!-- Capacity & Enrolled Students Box -->
          ${getCourseCapacityHTML(course)}

          ${course.topics && course.topics.length ? `
            <div class="course-topics-accordion">
              <button type="button" class="btn-toggle-topics" aria-expanded="false" onclick="HomePage.toggleTopics(this)">
                <span class="btn-toggle-topics-title">
                  <i data-lucide="book-open" style="color: ${course.color};"></i>
                  <span>محاور ومفردات الدورة (${course.topics.length} محاور)</span>
                </span>
                <i data-lucide="chevron-down" class="toggle-icon"></i>
              </button>
              <div class="course-topics-content">
                <ul class="course-topics-list">
                  ${course.topics.map(topic => `
                    <li>
                      <i data-lucide="check-circle-2" style="color: ${course.color};"></i>
                      <span>${Helpers.escape(topic)}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
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
            ${isSuspended ? `
              <div class="btn-course-register is-suspended" title="التسجيل في هذه الدورة معطل مؤقتاً">
                <span>التسجيل موقف حالياً</span>
                <i data-lucide="lock" style="width: 14px; height: 14px;"></i>
              </div>
            ` : `
              <a href="register.html?course=${course.id}" class="btn-course-register">
                <span>${actionText}</span>
                <i data-lucide="arrow-left"></i>
              </a>
            `}
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

  function toggleTopics(btn) {
    const accordion = btn.closest('.course-topics-accordion');
    if (!accordion) return;
    const isExpanded = accordion.classList.toggle('is-expanded');
    btn.setAttribute('aria-expanded', isExpanded);
    if (window.lucide) {
      lucide.createIcons({ root: accordion });
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
    init,
    toggleTopics
  };
})();

document.addEventListener('DOMContentLoaded', HomePage.init);
