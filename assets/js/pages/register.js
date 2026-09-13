/**
 * ITQAN — Registration Page Controller
 * إدارة نموذج التسجيل الإلكتروني، التحقق من السند، والاتصال بطبقة الـ API
 */
const RegisterPage = (() => {
  let selectedFile = null;
  let liveStats = {};

  async function init() {
    Navbar.render('navbar-container');
    Footer.render('footer-container');
    populateCoursesDropdown();
    checkUrlCourseParam();
    attachEvents();

    if (window.lucide) {
      lucide.createIcons();
    }

    if (window.Api && typeof window.Api.fetchRegistrationStats === 'function') {
      try {
        liveStats = await window.Api.fetchRegistrationStats();
        const select = document.getElementById('student-course-select');
        if (select && select.value) {
          updateCourseCapacityNotice(select.value);
        }
      } catch (e) {}
    }
  }

  /**
   * تعبئة قائمة الدورات المتاحة من ملف courses.js
   */
  function populateCoursesDropdown() {
    const select = document.getElementById('student-course-select');
    if (!select || typeof CoursesData === 'undefined') return;

    let optionsHtml = '<option value="">-- اختر الدبلوم أو البرنامج التدريبي * --</option>';
    CoursesData.forEach(c => {
      const typeBadge = c.badge && c.badge.includes('دبلوم') ? '🎓 دبلوم' : '📘 دورة';
      optionsHtml += `<option value="${c.id}" data-title="${Helpers.escape(c.title)}">${typeBadge}: ${Helpers.escape(c.title)} (${c.duration})</option>`;
    });

    select.innerHTML = optionsHtml;
  }

  /**
   * قراءة معرف الدورة والمسار من الرابط إن وجد
   */
  function checkUrlCourseParam() {
    const urlParams = new URLSearchParams(window.location.search);
    let courseParam = urlParams.get('course');
    const trackParam = urlParams.get('track');

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
        togglePythonTrack(courseParam);
      }
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
    const enrolled = (liveStats && typeof liveStats[course.id] === 'number') ? liveStats[course.id] : 0;
    const percent = Math.min(100, Math.round((enrolled / max) * 100));
    const isConfirmed = enrolled >= min;
    const remainingToMin = Math.max(0, min - enrolled);

    const statusBadge = isConfirmed
      ? `<span class="capacity-status-badge confirmed"><i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> مؤكدة الانطلاق</span>`
      : `<span class="capacity-status-badge enrolling"><i data-lucide="clock" style="width: 12px; height: 12px;"></i> متبقي ${remainingToMin} طلاب للبدء</span>`;

    capacityNotice.innerHTML = `
      <div class="course-capacity-card" style="margin-bottom: 0; margin-top: 10px; background: #F8FAFC; border: 1px solid #E2E8F0;">
        <div class="capacity-header">
          <div class="capacity-enrolled-wrap">
            <i data-lucide="users"></i>
            <span>المسجلون (المقبولون): <strong class="enrolled-count">${enrolled}</strong> طالب</span>
          </div>
          ${statusBadge}
        </div>
        <div class="capacity-progress-bar-wrap" title="نسبة التسجيل: ${percent}%">
          <div class="capacity-progress-fill ${isConfirmed ? 'is-confirmed' : ''}" style="width: ${percent}%;"></div>
        </div>
        <div class="capacity-footer-meta">
          <div class="capacity-meta-item">
            <i data-lucide="target" style="width: 12px; height: 12px; color: var(--clr-primary);"></i>
            <span>الحد الأدنى للبدء: <strong>${min} طالب</strong></span>
          </div>
          <div class="capacity-meta-item">
            <i data-lucide="user-check" style="width: 12px; height: 12px; color: var(--clr-text-muted);"></i>
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

    // ربط تغيير الدورة لإظهار تنبيه المتطلب السابق وتحديث المسارات إن وجدت
    const courseSelect = document.getElementById('student-course-select');
    if (courseSelect) {
      courseSelect.addEventListener('change', (e) => {
        updatePrerequisiteNotice(e.target.value);
        updateCourseCapacityNotice(e.target.value);
        togglePythonTrack(e.target.value);
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

      form.addEventListener('submit', handleFormSubmit);
    }

    // 4. أحداث شاشة النجاح والطباعة
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
   * التحقق من الحقول قبل الإرسال
   */
  function validateForm() {
    let isValid = true;

    // 1. الاسم بالعربي
    const nameAr = document.getElementById('student-name-ar');
    if (!nameAr.value.trim() || nameAr.value.trim().length < 3) {
      showFieldError('student-name-ar', 'يرجى إدخال الاسم الكامل باللغة العربية');
      isValid = false;
    }

    // 2. رقم الجوال
    const phone = document.getElementById('student-phone');
    const phoneVal = phone.value.trim();
    if (!phoneVal || phoneVal.length < 9) {
      showFieldError('student-phone', 'يرجى إدخال رقم جوال صحيح للتواصل (9 أرقام على الأقل)');
      isValid = false;
    }

    // 3. اختيار الدورة
    const course = document.getElementById('student-course-select');
    if (!course.value) {
      showFieldError('student-course-select', 'يرجى اختيار الدورة أو البرنامج التدريبي المطلوب');
      isValid = false;
    } else if (course.value === 'C003_PYTHON' || course.value === 'C002_PYTHON') {
      const trackSelect = document.getElementById('python-track-select');
      if (!trackSelect || !trackSelect.value) {
        showFieldError('python-track-select', 'يرجى تحديد أحد المسارين التخصصيين لدبلوم بايثون');
        isValid = false;
      }
    }

    // 4. سند الدفع
    if (!selectedFile) {
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
      Toast.error('يرجى التأكد من استكمال كافة الحقول المطلوبة وإرفاق سند الدفع');
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
    }

    formData.append('fullNameAr', document.getElementById('student-name-ar').value.trim());
    formData.append('fullNameEn', document.getElementById('student-name-en').value.trim());
    formData.append('phone', document.getElementById('student-phone').value.trim());
    formData.append('courseId', selectedCourseId);
    formData.append('courseTitle', selectedCourseTitle);
    formData.append('birthDate', document.getElementById('student-birth-date').value);
    formData.append('birthPlace', document.getElementById('student-birth-place').value.trim());
    formData.append('receiptFile', selectedFile);

    try {
      // 2. استدعاء طبقة الـ API المعتمدة
      const response = await Api.submitRegistration(formData);

      if (response && response.success) {
        // 3. عرض شاشة النجاح وتحديث بياناتها
        showSuccessModal(response, selectedCourseTitle);
      } else {
        Toast.error(response?.message || 'تعذر إرسال الطلب، يرجى المحاولة مرة أخرى');
      }
    } catch (err) {
      console.error('Error submitting registration:', err);
      Toast.error('حدث خطأ أثناء إرسال الطلب، يرجى التحقق من اتصال الإنترنت والمحاولة ثانية');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHtml;
    }
  }

  /**
   * عرض شاشة تأكيد النجاح
   */
  function showSuccessModal(response, customCourseTitle = null) {
    const modal = document.getElementById('registration-success-modal');
    if (!modal) return;

    const studentName = document.getElementById('student-name-ar').value.trim();
    const courseSelect = document.getElementById('student-course-select');
    const courseTitle = customCourseTitle || courseSelect.options[courseSelect.selectedIndex]?.getAttribute('data-title') || courseSelect.value;
    const phone = document.getElementById('student-phone').value.trim();

    // تحديث بيانات الإيصال
    const refEl = document.getElementById('success-reference-code');
    if (refEl) refEl.textContent = response.reference;

    const nameEl = document.getElementById('summary-student-name');
    if (nameEl) nameEl.textContent = studentName;

    const courseEl = document.getElementById('summary-course-title');
    if (courseEl) courseEl.textContent = courseTitle;

    const phoneEl = document.getElementById('summary-phone');
    if (phoneEl) phoneEl.textContent = phone;

    const timeEl = document.getElementById('summary-timestamp');
    if (timeEl) timeEl.textContent = response.timestamp;

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
