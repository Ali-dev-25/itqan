/**
 * ITQAN — Registration Page Controller
 * إدارة نموذج التسجيل الإلكتروني، التحقق من السند، والاتصال بطبقة الـ API
 */
const RegisterPage = (() => {
  let selectedFile = null;
  let liveStats = {};
  let pollingTimer = null;

  async function init() {
    Navbar.render('navbar-container');
    Footer.render('footer-container');

    // 1. مزامنة الدورات وإعداداتها من السيرفر قبل تعبئة القائمة
    await loadDynamicCourses();

    populateCoursesDropdown();
    checkUrlCourseParam();
    attachEvents();

    if (window.lucide) {
      lucide.createIcons();
    }

    await syncLiveStats();
    startLivePolling();

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        syncLiveStats();
      }
    });

    window.addEventListener('focus', () => {
      syncLiveStats();
    });

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
      } else {
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
          topics: dbCourse.topicsList || []
        });
      }
    });
  }

  async function syncLiveStats() {
    const api = getApi();
    if (!api || typeof api.fetchRegistrationStats !== 'function') return;
    try {
      liveStats = await api.fetchRegistrationStats();
      if (liveStats && liveStats.config && typeof liveStats.config === 'object' && typeof CoursesData !== 'undefined') {
        Object.entries(liveStats.config).forEach(([cid, cfg]) => {
          const course = CoursesData.find(c => c.id === cid);
          if (course) {
            course.status = cfg.status;
            course.allowInPerson = cfg.allow_in_person;
            course.allowOnline = cfg.allow_online;
          }
        });
      }
      const select = document.getElementById('student-course-select');
      if (select && select.value) {
        updateCourseCapacityNotice(select.value);
        applyCourseAttendanceRules(select.value);
        checkCourseSuspension(select.value);
      }
    } catch (e) {}
  }

  function startLivePolling() {
    if (pollingTimer) clearInterval(pollingTimer);
    pollingTimer = setInterval(() => {
      syncLiveStats();
    }, 3000);
  }

  /**
   * تعبئة قائمة الدورات المتاحة من ملف courses.js وقاعدة البيانات
   */
  function populateCoursesDropdown() {
    const select = document.getElementById('student-course-select');
    if (!select || typeof CoursesData === 'undefined') return;

    let optionsHtml = '<option value="">-- اختر الدبلوم أو البرنامج التدريبي * --</option>';
    CoursesData.forEach(c => {
      const typeBadge = c.badge && c.badge.includes('دبلوم') ? '🎓 دبلوم' : '📘 دورة';
      const isSuspended = c.status === 'suspended';
      const suspendedNotice = isSuspended ? ' ⚠️ [موقفة حالياً]' : '';
      optionsHtml += `<option value="${c.id}" data-title="${Helpers.escape(c.title)}" data-suspended="${isSuspended ? '1' : '0'}">${typeBadge}: ${Helpers.escape(c.title)} (${c.duration})${suspendedNotice}</option>`;
    });

    select.innerHTML = optionsHtml;
  }

  /**
   * قراءة معرف الدورة والمسار والمستوى من الرابط إن وجد
   */
  function checkUrlCourseParam() {
    const urlParams = new URLSearchParams(window.location.search);
    let courseParam = urlParams.get('course');
    const trackParam = urlParams.get('track');
    let levelParam = urlParams.get('level');

    if (courseParam) {
      // تطابق وتوافق خلفي لكافة الروابط القديمة والجديدة
      if (courseParam.includes('CPP_OOP') || courseParam === 'C002_CPP_OOP') {
        courseParam = 'C002_CPP_OOP';
      } else if (courseParam.includes('CPP_BASICS') || courseParam === 'C001_CPP_BASICS' || courseParam.startsWith('C001') || courseParam.includes('CPP')) {
        if (courseParam === 'C001_CPP_SQL') {
          courseParam = 'C006_SQL';
        } else if (courseParam === 'C002_CPP_OOP') {
          courseParam = 'C002_CPP_OOP';
        } else {
          courseParam = 'C001_CPP_BASICS';
        }
      } else if (courseParam.includes('DESKTOP') || trackParam === 'desktop' || courseParam === 'C004_PYTHON_DESKTOP') {
        courseParam = 'C004_PYTHON_DESKTOP';
      } else if (courseParam === 'C005_PYTHON_AI' || (courseParam.includes('PYTHON') && (courseParam.includes('AI') || trackParam === 'ai'))) {
        courseParam = 'C005_PYTHON_AI';
      } else if (courseParam.includes('PYTHON') || courseParam.includes('PY') || courseParam === 'C003_PYTHON_BASICS' || courseParam === 'C003_PYTHON' || courseParam === 'C002_PYTHON') {
        courseParam = 'C003_PYTHON_BASICS';
      } else if (courseParam.includes('TECHLINGO') || courseParam === 'C008_TECHLINGO' || courseParam === 'C006_TECHLINGO' || courseParam === 'C005_TECHLINGO' || courseParam === 'C003' || courseParam === 'C005') {
        // فحص إذا كان الرابط يحتوي على المستوى مباشرة
        if (courseParam.includes('_1A') || courseParam.endsWith('1A')) levelParam = levelParam || '1A';
        else if (courseParam.includes('_1B') || courseParam.endsWith('1B')) levelParam = levelParam || '1B';
        else if (courseParam.includes('_2A') || courseParam.endsWith('2A')) levelParam = levelParam || '2A';
        else if (courseParam.includes('_2B') || courseParam.endsWith('2B')) levelParam = levelParam || '2B';
        else if (courseParam.includes('_3A') || courseParam.endsWith('3A')) levelParam = levelParam || '3A';
        else if (courseParam.includes('_3B') || courseParam.endsWith('3B')) levelParam = levelParam || '3B';
        else if (courseParam.includes('_ALL')) levelParam = levelParam || 'ALL';
        courseParam = 'C008_TECHLINGO';
      } else if (['1A', '1B', '2A', '2B', '3A', '3B', 'ALL'].includes(courseParam.toUpperCase())) {
        levelParam = courseParam.toUpperCase();
        courseParam = 'C008_TECHLINGO';
      } else if (courseParam.includes('SQL') || courseParam === 'C006_SQL' || courseParam === 'C004_SQL' || courseParam === 'C003_SQL') {
        courseParam = 'C006_SQL';
      } else if (courseParam.includes('AI_PROMPT') || courseParam === 'C007_AI_PROMPT' || courseParam === 'C005_AI_PROMPT' || courseParam === 'C004_AI_PROMPT' || courseParam === 'C004') {
        courseParam = 'C007_AI_PROMPT';
      } else if (courseParam.includes('ICDL') || courseParam === 'C009_ICDL' || courseParam === 'C009') {
        courseParam = 'C009_ICDL';
      }

      const select = document.getElementById('student-course-select');
      if (select) {
        select.value = courseParam;
        updatePrerequisiteNotice(courseParam);
        updateCourseCapacityNotice(courseParam);
        applyCourseAttendanceRules(courseParam);
        checkCourseSuspension(courseParam);
        togglePythonTrack(courseParam);
        toggleTechLingoLevels(courseParam, levelParam ? levelParam.toUpperCase() : null);
      }
    } else if (levelParam) {
      const select = document.getElementById('student-course-select');
      if (select) {
        select.value = 'C008_TECHLINGO';
        updatePrerequisiteNotice('C008_TECHLINGO');
        updateCourseCapacityNotice('C008_TECHLINGO');
        applyCourseAttendanceRules('C008_TECHLINGO');
        checkCourseSuspension('C008_TECHLINGO');
        toggleTechLingoLevels('C008_TECHLINGO', levelParam.toUpperCase());
      }
    }
  }

  /**
   * فحص ما إذا كانت الدورة موقوفة حالياً وإظهار تنبيه وتعطيل زر الإرسال
   */
  function checkCourseSuspension(courseId) {
    let noticeEl = document.getElementById('course-suspended-notice');
    const submitBtn = document.getElementById('btn-submit-registration');
    if (typeof CoursesData === 'undefined') return;

    const course = CoursesData.find(c => c.id === courseId);
    const isSuspended = course && course.status === 'suspended';

    if (!noticeEl) {
      const selectGroup = document.getElementById('student-course-select')?.closest('.form-group');
      if (selectGroup) {
        noticeEl = document.createElement('div');
        noticeEl.id = 'course-suspended-notice';
        noticeEl.style.cssText = 'display: none; margin-top: 8px; font-size: 0.8rem; color: #991B1B; background: #FEE2E2; border: 1.5px solid #FCA5A5; padding: 10px 14px; border-radius: var(--r-md); align-items: center; gap: 8px; font-weight: 700;';
        selectGroup.appendChild(noticeEl);
      }
    }

    if (noticeEl) {
      if (isSuspended) {
        noticeEl.innerHTML = `
          <i data-lucide="alert-triangle" style="width: 18px; height: 18px; flex-shrink: 0; color: #DC2626;"></i>
          <span>تنبيه إداري: نعتذر، التسجيل في هذه الدورة موقف حالياً بناءً على توجيهات الإدارة. يرجى اختيار دورة أخرى متاحة.</span>
        `;
        noticeEl.style.display = 'flex';
        if (window.lucide) lucide.createIcons({ root: noticeEl });
        if (submitBtn) {
          submitBtn.disabled = true;
          if (!submitBtn.hasAttribute('data-orig-text')) {
            submitBtn.setAttribute('data-orig-text', submitBtn.innerHTML);
          }
          submitBtn.style.opacity = '0.55';
          submitBtn.style.cursor = 'not-allowed';
          submitBtn.innerHTML = `<span>التسجيل موقف حالياً في هذه الدورة</span>`;
        }
      } else {
        noticeEl.style.display = 'none';
        if (submitBtn && submitBtn.hasAttribute('data-orig-text')) {
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.cursor = 'pointer';
          submitBtn.innerHTML = submitBtn.getAttribute('data-orig-text');
          submitBtn.removeAttribute('data-orig-text');
          if (window.lucide) lucide.createIcons({ root: submitBtn });
        }
      }
    }
  }

  /**
   * تطبيق قواعد الحضور (حضوري / أونلاين) حسب إعدادات الدورة في لوحة التحكم
   */
  function applyCourseAttendanceRules(courseId) {
    const attendanceSelect = document.getElementById('student-attendance-mode');
    const attendanceHint = document.getElementById('attendance-hint');
    if (!attendanceSelect || typeof CoursesData === 'undefined') return;

    const course = CoursesData.find(c => c.id === courseId);
    const inPersonOption = attendanceSelect.querySelector('option[value="in_person"]');
    const onlineOption = attendanceSelect.querySelector('option[value="online"]');

    if (!course) {
      if (inPersonOption) {
        inPersonOption.disabled = false;
        inPersonOption.textContent = '🏫 حضورياً (في مقر وقاعات المنصة بمأرب)';
      }
      if (onlineOption) {
        onlineOption.disabled = false;
        onlineOption.textContent = '🌐 عن بعد (أونلاين عبر الإنترنت)';
      }
      if (attendanceHint) {
        attendanceHint.innerHTML = `<i data-lucide="info" style="width: 13px; height: 13px; flex-shrink: 0;"></i><span>متاح لكافة البرامج الاختيار بين الحضور المباشر في القاعات أو عن بعد تفاعلياً.</span>`;
      }
      return;
    }

    const allowInPerson = course.allowInPerson !== false;
    const allowOnline = course.allowOnline !== false;

    if (allowInPerson && !allowOnline) {
      // التدريب متاح حضورياً فقط (مثل تعطيل الأونلاين لدورة ICDL أو غيرها)
      if (onlineOption) {
        onlineOption.disabled = true;
        onlineOption.textContent = '🌐 عن بعد (غير متاح لهذه الدورة حالياً)';
      }
      if (inPersonOption) {
        inPersonOption.disabled = false;
        inPersonOption.textContent = '🏫 حضورياً (في مقر وقاعات المنصة بمأرب) — متاح';
      }
      attendanceSelect.value = 'in_person';
      if (attendanceHint) {
        attendanceHint.innerHTML = `<i data-lucide="alert-circle" style="width: 13px; height: 13px; flex-shrink: 0; color: #2563EB;"></i><span style="color: #1E40AF; font-weight: 700;">تنبيه: التدريب في هذه الدورة متاح حضورياً فقط بمقر وقاعات المنصة بمأرب.</span>`;
      }
    } else if (!allowInPerson && allowOnline) {
      // التدريب متاح عن بعد أونلاين فقط
      if (inPersonOption) {
        inPersonOption.disabled = true;
        inPersonOption.textContent = '🏫 حضورياً (غير متاح لهذه الدورة حالياً)';
      }
      if (onlineOption) {
        onlineOption.disabled = false;
        onlineOption.textContent = '🌐 عن بعد (أونلاين تفاعلياً عبر الإنترنت) — متاح';
      }
      attendanceSelect.value = 'online';
      if (attendanceHint) {
        attendanceHint.innerHTML = `<i data-lucide="alert-circle" style="width: 13px; height: 13px; flex-shrink: 0; color: #7C3AED;"></i><span style="color: #6D28D9; font-weight: 700;">تنبيه: التدريب في هذه الدورة متاح عن بعد (Online تفاعلياً) فقط.</span>`;
      }
    } else if (!allowInPerson && !allowOnline) {
      if (inPersonOption) inPersonOption.disabled = true;
      if (onlineOption) onlineOption.disabled = true;
      attendanceSelect.value = '';
      if (attendanceHint) {
        attendanceHint.innerHTML = `<i data-lucide="alert-circle" style="width: 13px; height: 13px; flex-shrink: 0; color: #DC2626;"></i><span style="color: #DC2626; font-weight: 700;">التسجيل غير متاح حالياً لكلا النمطين.</span>`;
      }
    } else {
      // متاح كلاهما
      if (inPersonOption) {
        inPersonOption.disabled = false;
        inPersonOption.textContent = '🏫 حضورياً (في مقر وقاعات المنصة بمأرب)';
      }
      if (onlineOption) {
        onlineOption.disabled = false;
        onlineOption.textContent = '🌐 عن بعد (أونلاين عبر الإنترنت)';
      }
      if (attendanceHint) {
        attendanceHint.innerHTML = `<i data-lucide="info" style="width: 13px; height: 13px; flex-shrink: 0;"></i><span>متاح لهذه الدورة الاختيار بين الحضور المباشر في القاعات أو عن بعد تفاعلياً.</span>`;
      }
    }

    if (window.lucide && attendanceHint) {
      lucide.createIcons({ root: attendanceHint });
    }
  }

  /**
   * إظهار أو إخفاء تنبيه المتطلب السابق للدورة أو شرط إحضار اللابتوب
   */
  function updatePrerequisiteNotice(courseId) {
    const prereqNotice = document.getElementById('course-prerequisite-notice');
    const prereqText = document.getElementById('course-prerequisite-text');
    if (!prereqNotice || !prereqText || typeof CoursesData === 'undefined') return;

    const course = CoursesData.find(c => c.id === courseId);
    if (course && course.prerequisite) {
      prereqText.textContent = course.prerequisite;
      prereqNotice.style.display = 'flex';
      if (window.lucide) {
        lucide.createIcons({ root: prereqNotice });
      }
    } else {
      prereqNotice.style.display = 'none';
    }
  }

  /**
   * إظهار أو إخفاء بطاقة سعة ومقاعد الدورة والمسجلين والحد الأدنى والأقصى
   * تشمل خطين منفصلين: شريط للحضوري وشريط للأونلاين (عن بعد) بتصميم أنيق ومصغر
   */
  function updateCourseCapacityNotice(courseId) {
    const capacityNotice = document.getElementById('course-capacity-notice');
    if (!capacityNotice || typeof CoursesData === 'undefined') return;

    if (!courseId) {
      capacityNotice.style.display = 'none';
      capacityNotice.innerHTML = '';
      return;
    }

    const course = CoursesData.find(c => c.id === courseId);
    if (!course) {
      capacityNotice.style.display = 'none';
      return;
    }

    const min = course.minStudents || 15;
    const max = course.maxStudents || 30;

    // استخراج أعداد المسجلين للحضوري وعن بعد
    const inPersonCount = (liveStats && typeof liveStats[`${course.id}_in_person`] === 'number')
      ? liveStats[`${course.id}_in_person`]
      : (liveStats?.breakdown?.[course.id]?.in_person || 0);

    const onlineCount = (liveStats && typeof liveStats[`${course.id}_online`] === 'number')
      ? liveStats[`${course.id}_online`]
      : (liveStats?.breakdown?.[course.id]?.online || 0);

    const enrolledTotal = (liveStats && typeof liveStats[course.id] === 'number')
      ? liveStats[course.id]
      : (inPersonCount + onlineCount);

    const percentInPerson = Math.min(100, Math.round((inPersonCount / max) * 100));
    const percentOnline = Math.min(100, Math.round((onlineCount / max) * 100));
    const displayInPersonPercent = inPersonCount > 0 ? Math.max(5, percentInPerson) : 0;
    const displayOnlinePercent = onlineCount > 0 ? Math.max(5, percentOnline) : 0;

    const isConfirmed = enrolledTotal >= min;
    const remainingToMin = Math.max(0, min - enrolledTotal);

    const allowInPerson = course.allowInPerson !== false;
    const allowOnline = course.allowOnline !== false;

    const statusBadge = isConfirmed
      ? `<span class="capacity-status-badge confirmed"><i data-lucide="check-circle" style="width: 11px; height: 11px;"></i> مؤكدة الانطلاق</span>`
      : `<span class="capacity-status-badge enrolling"><i data-lucide="clock" style="width: 11px; height: 11px;"></i> متبقي ${remainingToMin} طلاب للبدء</span>`;

    let barsHtml = '';
    if (allowInPerson) {
      barsHtml += `
          <!-- 1. شريط التدريب الحضوري -->
          <div class="capacity-mode-row">
            <div class="capacity-mode-info">
              <span class="capacity-mode-label">
                <i data-lucide="map-pin" class="icon-inperson"></i>
                <span>تدريب حضوري:</span>
              </span>
              <span class="capacity-mode-count"><strong class="count-inperson">${inPersonCount}</strong> طالب <span class="mode-percent">(${percentInPerson}%)</span></span>
            </div>
            <div class="capacity-progress-bar-wrap mode-bar inperson" title="المسجلون حضورياً: ${inPersonCount} طالب">
              <div class="capacity-progress-fill fill-inperson" style="width: ${displayInPersonPercent}%;"></div>
            </div>
          </div>
      `;
    }

    if (allowOnline) {
      barsHtml += `
          <!-- 2. شريط التدريب عن بعد (Online) -->
          <div class="capacity-mode-row">
            <div class="capacity-mode-info">
              <span class="capacity-mode-label">
                <i data-lucide="globe" class="icon-online"></i>
                <span>عن بعد (Online):</span>
              </span>
              <span class="capacity-mode-count"><strong class="count-online">${onlineCount}</strong> طالب <span class="mode-percent">(${percentOnline}%)</span></span>
            </div>
            <div class="capacity-progress-bar-wrap mode-bar online" title="المسجلون عن بعد أونلاين: ${onlineCount} طالب">
              <div class="capacity-progress-fill fill-online" style="width: ${displayOnlinePercent}%;"></div>
            </div>
          </div>
      `;
    }

    capacityNotice.innerHTML = `
      <div class="course-capacity-card" style="margin-bottom: 0; margin-top: 10px; background: #F8FAFC; border: 1px solid #E2E8F0;">
        <div class="capacity-header">
          <div class="capacity-enrolled-wrap">
            <i data-lucide="users"></i>
            <span>المسجلون (المقبولون): <strong class="enrolled-count">${enrolledTotal}</strong> طالب</span>
          </div>
          <div class="capacity-badge-wrap">
            ${statusBadge}
          </div>
        </div>

        <div class="capacity-dual-bars">
          ${barsHtml}
        </div>

        <div class="capacity-footer-meta">
          <div class="capacity-meta-item">
            <i data-lucide="target" style="color: var(--clr-primary);"></i>
            <span>الحد الأدنى للبدء: <strong>${min} طالب</strong></span>
          </div>
          <div class="capacity-meta-item">
            <i data-lucide="user-check" style="color: var(--clr-text-muted);"></i>
            <span>الحد الأعلى: <strong>${max} مقعد</strong></span>
          </div>
        </div>
      </div>
    `;

    capacityNotice.style.display = 'block';
    if (window.lucide) {
      lucide.createIcons({ root: capacityNotice });
    }
  }

  /**
   * إظهار أو إخفاء محدد المسار التخصصي لدبلوم بايثون
   */
  function togglePythonTrack(courseId) {
    const trackGroup = document.getElementById('python-track-group');
    const trackSelect = document.getElementById('python-track-select');
    if (!trackGroup) return;

    if (courseId === 'C003_PYTHON' || courseId === 'C002_PYTHON') {
      trackGroup.style.display = 'block';
      if (window.lucide) lucide.createIcons({ root: trackGroup });
    } else {
      trackGroup.style.display = 'none';
      if (trackSelect) {
        trackSelect.value = '';
        trackSelect.classList.remove('is-invalid');
        const err = document.getElementById('python-track-select-error');
        if (err) err.classList.remove('visible');
      }
    }
  }

  /**
   * إظهار أو إخفاء محدد المستوى المطلوب لدبلوم اللغة الإنجليزية TechLingo
   */
  function toggleTechLingoLevels(courseId, initialLevel = null) {
    const levelGroup = document.getElementById('techlingo-level-group');
    const levelSelect = document.getElementById('techlingo-level-select');
    if (!levelGroup) return;

    if (courseId === 'C008_TECHLINGO' || (courseId && courseId.includes('TECHLINGO'))) {
      levelGroup.style.display = 'block';
      if (initialLevel && levelSelect) {
        levelSelect.value = initialLevel;
      }
      if (window.lucide) lucide.createIcons({ root: levelGroup });
    } else {
      levelGroup.style.display = 'none';
      if (levelSelect) {
        levelSelect.value = '';
        levelSelect.classList.remove('is-invalid');
        const err = document.getElementById('techlingo-level-select-error');
        if (err) err.classList.remove('visible');
      }
    }
  }

  /**
   * ربط كافة أحداث الصفحة والنماذج
   */
  function attachEvents() {
    // 1. نسخ أرقام الحسابات والمحافظ
    const copyBtns = document.querySelectorAll('.btn-copy-account');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const accNum = btn.getAttribute('data-copy') || btn.parentElement?.querySelector('.account-num-val')?.innerText || '';
        const providerName = btn.getAttribute('data-name') || 'الحساب';
        if (!accNum) return;

        navigator.clipboard.writeText(accNum.replace(/\s+/g, '')).then(() => {
          Toast.success(`تم نسخ رقم ${providerName} بنجاح: ${accNum}`);
        }).catch(() => {
          Toast.info(`رقم ${providerName}: ${accNum}`);
        });
      });
    });

    // 2. معالجة رفع وسحب وإفلات السند
    const dropzone = document.getElementById('receipt-dropzone');
    const fileInput = document.getElementById('receipt-file-input');
    const chooseBtn = document.getElementById('btn-browse-file');
    const removeBtn = document.getElementById('btn-remove-receipt');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target !== removeBtn && !removeBtn?.contains(e.target)) {
          fileInput.click();
        }
      });

      if (chooseBtn) {
        chooseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          fileInput.click();
        });
      }

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleFileSelected(e.target.files[0]);
        }
      });

      // Drag & Drop
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('drag-over');
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('drag-over');
        }, false);
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
          handleFileSelected(files[0]);
        }
      }, false);
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedFile();
      });
    }

    // ربط تغيير الدورة لإظهار تنبيه المتطلب السابق وتحديث المسارات والمستويات إن وجدت
    const courseSelect = document.getElementById('student-course-select');
    if (courseSelect) {
      courseSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        updatePrerequisiteNotice(val);
        updateCourseCapacityNotice(val);
        applyCourseAttendanceRules(val);
        checkCourseSuspension(val);
        togglePythonTrack(val);
        toggleTechLingoLevels(val);
      });
    }

    const pythonTrackSelect = document.getElementById('python-track-select');
    if (pythonTrackSelect) {
      pythonTrackSelect.addEventListener('change', () => {
        if (pythonTrackSelect.value) {
          pythonTrackSelect.classList.remove('is-invalid');
          const err = document.getElementById('python-track-select-error');
          if (err) err.classList.remove('visible');
        }
      });
    }

    const techLingoLevelSelect = document.getElementById('techlingo-level-select');
    if (techLingoLevelSelect) {
      techLingoLevelSelect.addEventListener('change', () => {
        if (techLingoLevelSelect.value) {
          techLingoLevelSelect.classList.remove('is-invalid');
          const err = document.getElementById('techlingo-level-select-error');
          if (err) err.classList.remove('visible');
        }
      });
    }

    // 3. مسح رسائل الخطأ عند الكتابة
    const form = document.getElementById('student-registration-form');
    if (form) {
      form.addEventListener('input', (e) => {
        const input = e.target;
        if (input.classList.contains('is-invalid')) {
          input.classList.remove('is-invalid');
          const errorEl = document.getElementById(`${input.id}-error`);
          if (errorEl) errorEl.classList.remove('visible');
        }
      });

      form.addEventListener('change', (e) => {
        const input = e.target;
        if (input.classList.contains('is-invalid')) {
          input.classList.remove('is-invalid');
          const errorEl = document.getElementById(`${input.id}-error`);
          if (errorEl) errorEl.classList.remove('visible');
        }
      });

      form.addEventListener('submit', handleFormSubmit);
    }

    // 4. ربط تغيير موقع الإقامة (داخل الوطن / من بلد آخر)
    const residenceSelect = document.getElementById('student-residence');
    if (residenceSelect) {
      residenceSelect.addEventListener('change', (e) => {
        handleResidenceChange(e.target.value);
      });
    }

    // 5. أحداث شاشة النجاح والطباعة ونسخ أرقام الواتساب
    const printBtn = document.getElementById('btn-print-receipt');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    const copyRefBtn = document.getElementById('btn-copy-reference');
    if (copyRefBtn) {
      copyRefBtn.addEventListener('click', () => {
        const refCode = document.getElementById('success-reference-code')?.innerText || '';
        if (refCode) {
          navigator.clipboard.writeText(refCode).then(() => {
            Toast.success('تم نسخ الرقم المرجعي للطلب بنجاح');
          });
        }
      });
    }

    // نسخ أرقام الواتساب المباشرة
    const waCopyBtns = document.querySelectorAll('.btn-wa-copy');
    waCopyBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const num = btn.getAttribute('data-copy') || '';
        if (num) {
          navigator.clipboard.writeText('+' + num).then(() => {
            Toast.success(`تم نسخ رقم الواتساب: +${num}`);
          });
        }
      });
    });
  }

  /**
   * التبديل الشرطي لأقسام السداد بناءً على موقع الإقامة
   */
  function handleResidenceChange(residenceVal) {
    const receiptSection = document.querySelector('.receipt-upload-section');
    const bankSection = document.querySelector('.bank-details-card');
    const intNotice = document.getElementById('international-student-notice');

    if (residenceVal === 'outside_yemen') {
      // الطالب من خارج الوطن: إخفاء رفع السند وقسم البنوك المحلية وإظهار التنبيه التوجيهي
      if (receiptSection) receiptSection.style.display = 'none';
      if (bankSection) bankSection.style.display = 'none';
      if (intNotice) {
        intNotice.style.display = 'block';
        if (window.lucide) lucide.createIcons({ root: intNotice });
      }
      clearSelectedFile();
      const receiptErr = document.getElementById('receipt-file-error');
      if (receiptErr) receiptErr.classList.remove('visible');
    } else {
      // الطالب من داخل الوطن: إظهار الحسابات البنكية المحلية ورفع السند
      if (receiptSection) receiptSection.style.display = 'block';
      if (bankSection) bankSection.style.display = 'block';
      if (intNotice) intNotice.style.display = 'none';
    }
  }

  /**
   * التحقق من الملف المختار وعرض المعاينة
   */
  function handleFileSelected(file) {
    const errorEl = document.getElementById('receipt-file-error');
    if (errorEl) errorEl.classList.remove('visible');

    // 1. التحقق من نوع وامتداد الملف
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pjpeg', 'application/pdf'];
    const isAllowed = allowedExts.includes(ext) || allowedTypes.includes(file.type.toLowerCase()) || file.type.startsWith('image/');

    if (!isAllowed) {
      showFileError('صيغة الملف غير مدعومة. يرجى رفع صورة (JPG, PNG, WEBP) أو مستند (PDF)');
      clearSelectedFile();
      return;
    }

    // 2. التحقق من حجم الملف (الحد الأقصى: 5 ميجابايت)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showFileError('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 5 ميجابايت');
      clearSelectedFile();
      return;
    }

    selectedFile = file;

    // عرض صندوق المعاينة
    const previewBox = document.getElementById('receipt-preview-box');
    const thumbContainer = document.getElementById('receipt-thumb-container');
    const nameEl = document.getElementById('receipt-file-name');
    const sizeEl = document.getElementById('receipt-file-size');

    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatFileSize(file.size);

    if (thumbContainer) {
      if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          thumbContainer.innerHTML = `<img src="${e.target.result}" alt="معاينة سند الدفع" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" />`;
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf' || ext === 'pdf') {
        thumbContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #EF4444;">
            <i data-lucide="file-text" style="width: 26px; height: 26px;"></i>
            <span style="font-size: 9px; font-weight: bold; margin-top: 2px;">PDF</span>
          </div>
        `;
        if (window.lucide) lucide.createIcons({ root: thumbContainer });
      }
    }

    if (previewBox) previewBox.classList.add('visible');
    const dropzone = document.getElementById('receipt-dropzone');
    if (dropzone) dropzone.style.display = 'none';
  }

  function clearSelectedFile() {
    selectedFile = null;
    const fileInput = document.getElementById('receipt-file-input');
    if (fileInput) fileInput.value = '';

    const previewBox = document.getElementById('receipt-preview-box');
    if (previewBox) previewBox.classList.remove('visible');

    const dropzone = document.getElementById('receipt-dropzone');
    if (dropzone) dropzone.style.display = 'block';
  }

  function showFileError(msg) {
    const errorEl = document.getElementById('receipt-file-error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
    }
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * التحقق الشامل من كافة الحقول قبل الإرسال (جميع المدخلات مطلوبة)
   */
  function validateForm() {
    let isValid = true;

    // 1. الاسم بالعربي (إلزامي)
    const nameAr = document.getElementById('student-name-ar');
    if (!nameAr.value.trim() || nameAr.value.trim().length < 3) {
      showFieldError('student-name-ar', 'يرجى إدخال الاسم الكامل باللغة العربية (3 أحرف على الأقل)');
      isValid = false;
    }

    // 2. الاسم بالإنجليزي (إلزامي)
    const nameEn = document.getElementById('student-name-en');
    if (!nameEn.value.trim() || nameEn.value.trim().length < 3) {
      showFieldError('student-name-en', 'يرجى إدخال الاسم الكامل باللغة الإنجليزية كما في الوثائق الرسمية');
      isValid = false;
    }

    // 3. رقم الجوال / الواتساب (إلزامي)
    const phone = document.getElementById('student-phone');
    const phoneVal = phone.value.trim();
    if (!phoneVal || phoneVal.length < 9) {
      showFieldError('student-phone', 'يرجى إدخال رقم جوال صحيح للتواصل (9 أرقام على الأقل)');
      isValid = false;
    }

    // 4. موقع الإقامة (إلزامي: داخل الوطن أم من بلد آخر)
    const residence = document.getElementById('student-residence');
    if (!residence || !residence.value) {
      showFieldError('student-residence', 'يرجى تحديد موقع الإقامة (داخل الوطن أم من بلد آخر)');
      isValid = false;
    }

    // 5. اختيار الدورة التدريبية (إلزامي)
    const course = document.getElementById('student-course-select');
    if (!course || !course.value) {
      showFieldError('student-course-select', 'يرجى اختيار الدورة أو البرنامج التدريبي المطلوب');
      isValid = false;
    } else if (course.value === 'C003_PYTHON' || course.value === 'C002_PYTHON') {
      const trackSelect = document.getElementById('python-track-select');
      if (!trackSelect || !trackSelect.value) {
        showFieldError('python-track-select', 'يرجى تحديد أحد المسارين التخصصيين لدبلوم بايثون');
        isValid = false;
      }
    } else if (course.value === 'C008_TECHLINGO' || course.value.includes('TECHLINGO')) {
      const levelSelect = document.getElementById('techlingo-level-select');
      if (!levelSelect || !levelSelect.value) {
        showFieldError('techlingo-level-select', 'يرجى تحديد المستوى المطلوب للتسجيل في دبلوم اللغة الإنجليزية');
        isValid = false;
      }
    }

    // 6. طريقة / نمط الحضور (إلزامي: حضوري أم عن بعد)
    const attendanceMode = document.getElementById('student-attendance-mode');
    if (!attendanceMode || !attendanceMode.value) {
      showFieldError('student-attendance-mode', 'يرجى تحديد نمط الحضور المطلوب (حضوري أم عن بعد)');
      isValid = false;
    }

    // 7. تاريخ الميلاد (إلزامي)
    const birthDate = document.getElementById('student-birth-date');
    if (!birthDate || !birthDate.value) {
      showFieldError('student-birth-date', 'يرجى إدخال تاريخ الميلاد كاملاً');
      isValid = false;
    }

    // 8. مكان الميلاد / المدينة (إلزامي)
    const birthPlace = document.getElementById('student-birth-place');
    if (!birthPlace || !birthPlace.value.trim()) {
      showFieldError('student-birth-place', 'يرجى إدخال مكان الميلاد / المدينة والدولة');
      isValid = false;
    }

    // 9. سند الدفع (إلزامي فقط للطلاب من داخل الوطن، ومستثنى للطلاب من بلد آخر)
    const isOutside = (residence && residence.value === 'outside_yemen');
    if (!isOutside && !selectedFile) {
      showFileError('يرجى إرفاق صورة أو مستند سند الحوالة / الإيداع لإتمام التسجيل');
      isValid = false;
    }

    return isValid;
  }

  function showFieldError(fieldId, msg) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.add('is-invalid');
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.add('visible');
    }
  }

  /**
   * معالجة إرسال النموذج وتجهيز FormData
   */
  async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      Toast.error('يرجى التأكد من استكمال كافة الحقول المطلوبة');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-form');
    const originalBtnHtml = submitBtn.innerHTML;

    // حالة التحميل أثناء الإرسال
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <div style="width: 18px; height: 18px; border: 2px solid #ffffff; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>
      <span>جاري إرسال طلب التسجيل...</span>
    `;

    // 1. تجهيز الـ FormData لإرسالها كـ multipart/form-data
    const formData = new FormData();
    const courseSelect = document.getElementById('student-course-select');
    let selectedCourseId = courseSelect.value;
    let selectedCourseTitle = courseSelect.options[courseSelect.selectedIndex]?.getAttribute('data-title') || courseSelect.value;

    if (selectedCourseId === 'C003_PYTHON' || selectedCourseId === 'C002_PYTHON') {
      const trackSelect = document.getElementById('python-track-select');
      const trackVal = trackSelect ? trackSelect.value : '';
      if (trackVal === 'desktop') {
        selectedCourseId = 'C003_PYTHON_DESKTOP';
        selectedCourseTitle = 'دبلوم لغة بايثون التخصصي (مسار تطبيقات سطح المكتب GUI)';
      } else if (trackVal === 'ai') {
        selectedCourseId = 'C003_PYTHON_AI';
        selectedCourseTitle = 'دبلوم لغة بايثون التخصصي (مسار الذكاء الاصطناعي والبيانات AI)';
      }
    } else if (selectedCourseId === 'C008_TECHLINGO' || selectedCourseId.includes('TECHLINGO')) {
      const levelSelect = document.getElementById('techlingo-level-select');
      const levelVal = levelSelect ? levelSelect.value : '';
      const levelNames = {
        '1A': 'المستوى 1A (أساسيات مصطلحات وتواصل IT)',
        '1B': 'المستوى 1B (الشبكات والدعم الفني وأمن المعلومات)',
        '2A': 'المستوى 2A (الأنظمة والبرمجيات والبنية التقنية)',
        '2B': 'المستوى 2B (تطوير الأنظمة وإدارة مشاريع IT)',
        '3A': 'المستوى 3A (الحاسوب والشبكات والويب المتقدم)',
        '3B': 'المستوى 3B (التقنيات الحديثة والمقابلات والمهارات المهنية)',
        'ALL': 'الدبلوم الشامل بالكامل (كافة المستويات الـ 6)'
      };
      if (levelVal === 'ALL') {
        selectedCourseId = 'C008_TECHLINGO';
        selectedCourseTitle = 'دبلوم اللغة الإنجليزية التخصصية للحاسوب (TechLingo) — ' + (levelNames[levelVal] || 'الدبلوم الشامل');
      } else if (levelVal) {
        selectedCourseId = 'C008_TECHLINGO_' + levelVal;
        selectedCourseTitle = 'دبلوم إنجليزية الحاسوب TechLingo — ' + (levelNames[levelVal] || ('المستوى ' + levelVal));
      }
    }

    const residenceVal = document.getElementById('student-residence').value;
    const attendanceVal = document.getElementById('student-attendance-mode').value;

    formData.append('fullNameAr', document.getElementById('student-name-ar').value.trim());
    formData.append('fullNameEn', document.getElementById('student-name-en').value.trim());
    formData.append('phone', document.getElementById('student-phone').value.trim());
    formData.append('residenceLocation', residenceVal);
    formData.append('attendanceMode', attendanceVal);
    formData.append('courseId', selectedCourseId);
    formData.append('courseTitle', selectedCourseTitle);
    formData.append('birthDate', document.getElementById('student-birth-date').value);
    formData.append('birthPlace', document.getElementById('student-birth-place').value.trim());

    if (selectedFile) {
      formData.append('receiptFile', selectedFile);
    }

    try {
      // 2. استدعاء طبقة الـ API المعتمدة
      const response = await Api.submitRegistration(formData);

      if (response && response.success) {
        // 3. عرض شاشة النجاح وتحديث بياناتها
        showSuccessModal(response, selectedCourseTitle, residenceVal, attendanceVal);
        if (typeof Api.notifyStatsUpdated === 'function') {
          Api.notifyStatsUpdated();
        }
      } else {
        Toast.error(response?.message || 'تعذر إرسال الطلب، يرجى المحاولة مرة أخرى');
      }
    } catch (err) {
      console.error('Error submitting registration:', err);
      const errMsg = (err && err.message) ? err.message : 'حدث خطأ أثناء إرسال الطلب، يرجى مراجعة البيانات والمحاولة ثانية';
      Toast.error(errMsg);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }

  /**
   * عرض شاشة تأكيد النجاح وتحديث بياناتها وفقاً لنوع وموقع الطالب
   */
  function showSuccessModal(response, customCourseTitle = null, residenceVal = 'inside_yemen', attendanceVal = 'in_person') {
    const modal = document.getElementById('registration-success-modal');
    if (!modal) return;

    const studentName = document.getElementById('student-name-ar').value.trim();
    const courseSelect = document.getElementById('student-course-select');
    const courseTitle = customCourseTitle || courseSelect.options[courseSelect.selectedIndex]?.getAttribute('data-title') || courseSelect.value;
    const phone = document.getElementById('student-phone').value.trim();

    // تحديث الرقم المرجعي
    const refEl = document.getElementById('success-reference-code');
    if (refEl) refEl.textContent = response.reference;

    // تحديث بيانات المتدرب
    const nameEl = document.getElementById('summary-student-name');
    if (nameEl) nameEl.textContent = studentName;

    const courseEl = document.getElementById('summary-course-title');
    if (courseEl) courseEl.textContent = courseTitle;

    const phoneEl = document.getElementById('summary-phone');
    if (phoneEl) phoneEl.textContent = phone;

    const timeEl = document.getElementById('summary-timestamp');
    if (timeEl) timeEl.textContent = response.timestamp;

    // تحديث نمط الحضور
    const attendanceEl = document.getElementById('summary-attendance-mode');
    if (attendanceEl) {
      attendanceEl.textContent = (attendanceVal === 'online') ? '🌐 عن بعد (أونلاين عبر الإنترنت)' : '🏫 تدريب حضوري (مقر المنصة - مأرب)';
    }

    // تحديث موقع الإقامة
    const residenceEl = document.getElementById('summary-residence-location');
    if (residenceEl) {
      residenceEl.textContent = (residenceVal === 'outside_yemen') ? '🌍 من خارج الوطن (بلد آخر)' : '🇾🇪 من داخل الوطن (اليمن)';
    }

    const titleEl = document.getElementById('success-title');
    const subEl = document.getElementById('success-subtitle');
    const waInternationalBox = document.getElementById('whatsapp-international-box');
    const retentionAlert = document.getElementById('success-retention-alert');
    const receiptStatusEl = document.getElementById('summary-receipt-status');

    if (residenceVal === 'outside_yemen') {
      // 1. حالة الطالب من خارج الوطن
      if (titleEl) titleEl.textContent = 'تم استلام بيانات التسجيل بنجاح! 🌍';
      if (subEl) {
        subEl.innerHTML = `شكراً لك يا <strong>${Helpers.escape(studentName)}</strong>. تم حفظ بيانات تسجيلك بنجاح. نظراً لتسجيلك من خارج الوطن، <strong>يرجى التواصل عبر الواتساب أدناه لإرسال سند التسديد وتأكيد انطلاق تدريبك</strong>.`;
      }

      // إظهار بطاقة الواتساب المباشرة للرقمين
      if (waInternationalBox) {
        waInternationalBox.style.display = 'block';

        // تجهيز نص رسالة الواتساب المسبقة
        const waMsg = `مرحباً إدارة منصة إتقان، أنا المتدرب: ${studentName}، قمت بالتسجيل من خارج الوطن في دورة: ${courseTitle}. رقمي المرجعي لطلب التسجيل هو: ${response.reference}. أود إرسال سند السداد وتأكيد تسجيلي معكم.`;
        const encodedMsg = encodeURIComponent(waMsg);

        const waLink1 = document.getElementById('btn-wa-link-1');
        if (waLink1) waLink1.href = `https://wa.me/967771807595?text=${encodedMsg}`;

        const waLink2 = document.getElementById('btn-wa-link-2');
        if (waLink2) waLink2.href = `https://wa.me/967778375155?text=${encodedMsg}`;
      }

      // تحديث حالة السند في الجدول
      if (receiptStatusEl) {
        receiptStatusEl.style.color = '#D97706';
        receiptStatusEl.innerHTML = `
          <i data-lucide="clock" style="width: 14px; height: 14px; color: #D97706;"></i>
          <span>بانتظار الإرسال عبر الواتساب (يرجى المتابعة أعلاه)</span>
        `;
      }

      // ضبط صندوق التنبيه
      if (retentionAlert) {
        const desc = document.getElementById('retention-desc');
        if (desc) {
          desc.innerHTML = `يرجى <strong>الاحتفاظ بهذا السند وتصويره أو طباعته</strong> برقمك المرجعي (<strong>${response.reference}</strong>) ومشاركته مع إدارة المنصة عبر الواتساب لتأكيد قيدك واعتمادك فوراً.`;
        }
      }

    } else {
      // 2. حالة الطالب من داخل الوطن (مع سند مرفوع)
      if (titleEl) titleEl.textContent = 'تم استلام طلب التسجيل بنجاح!';
      if (subEl) {
        subEl.innerHTML = 'شكراً لك. تم استلام بياناتك وسند السداد بنجاح. <strong>يرجى الاحتفاظ بهذا السند وطباعته أو حفظه</strong>، حيث يمثل وثيقتك المعتمدة لتأكيد القبول ومتابعة الطلب.';
      }

      if (waInternationalBox) {
        waInternationalBox.style.display = 'none';
      }

      if (receiptStatusEl) {
        receiptStatusEl.style.color = 'var(--clr-success)';
        receiptStatusEl.innerHTML = `
          <i data-lucide="check-circle-2" style="width: 14px; height: 14px;"></i>
          <span>تم الإرفاق بنجاح</span>
        `;
      }

      if (retentionAlert) {
        const desc = document.getElementById('retention-desc');
        if (desc) {
          desc.innerHTML = 'يرجى <strong>الاحتفاظ بهذا السند وطباعته فوراً</strong> (أو حفظه كملف PDF / لقطة شاشة)، حيث يُعد وثيقتك المرجعية الرسمية لإتمام إجراءات القبول ومطابقة الحساب عند بدء التدريب.';
        }
      }
    }

    // فتح النافذة المنبثقة
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    if (window.lucide) {
      lucide.createIcons({ root: modal });
    }
  }

  return {
    init
  };
})();

document.addEventListener('DOMContentLoaded', RegisterPage.init);
