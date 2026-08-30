/**
 * ITQAN — Registration Page Controller
 * إدارة نموذج التسجيل الإلكتروني، التحقق من السند، والاتصال بطبقة الـ API
 */
const RegisterPage = (() => {
  let selectedFile = null;

  function init() {
    Navbar.render('navbar-container');
    Footer.render('footer-container');
    populateCoursesDropdown();
    checkUrlCourseParam();
    attachEvents();

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  /**
   * تعبئة قائمة الدورات المتاحة من ملف courses.js
   */
  function populateCoursesDropdown() {
    const select = document.getElementById('student-course-select');
    if (!select || typeof CoursesData === 'undefined') return;

    let optionsHtml = '<option value="">-- اختر البرنامج / الدورة التدريبية * --</option>';
    CoursesData.forEach(c => {
      optionsHtml += `<option value="${c.id}" data-title="${Helpers.escape(c.title)}">${Helpers.escape(c.title)} (${c.duration})</option>`;
    });

    select.innerHTML = optionsHtml;
  }

  /**
   * قراءة معرف الدورة من الرابط إن وجد (مثل: register.html?course=C001)
   */
  function checkUrlCourseParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseParam = urlParams.get('course');
    if (courseParam) {
      const select = document.getElementById('student-course-select');
      if (select) {
        select.value = courseParam;
      }
    }
  }

  /**
   * ربط كافة أحداث الصفحة والنماذج
   */
  function attachEvents() {
    // 1. نسخ رقم الحساب البنكي
    const copyBtn = document.getElementById('btn-copy-bank-account');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const accNum = document.getElementById('bank-account-number')?.innerText || '30012345678';
        navigator.clipboard.writeText(accNum.replace(/\s+/g, '')).then(() => {
          Toast.success('تم نسخ رقم الحساب البنكي بنجاح');
        }).catch(() => {
          Toast.info('رقم الحساب: ' + accNum);
        });
      });
    }

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

    // 1. التحقق من نوع الملف
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showFileError('صيغة الملف غير مدعومة. يرجى رفع صورة (JPG, PNG) أو مستند (PDF)');
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
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          thumbContainer.innerHTML = `<img src="${e.target.result}" alt="معاينة سند الدفع" />`;
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
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
    const selectedCourseTitle = courseSelect.options[courseSelect.selectedIndex]?.getAttribute('data-title') || courseSelect.value;

    formData.append('fullNameAr', document.getElementById('student-name-ar').value.trim());
    formData.append('fullNameEn', document.getElementById('student-name-en').value.trim());
    formData.append('phone', document.getElementById('student-phone').value.trim());
    formData.append('courseId', courseSelect.value);
    formData.append('courseTitle', selectedCourseTitle);
    formData.append('birthDate', document.getElementById('student-birth-date').value);
    formData.append('birthPlace', document.getElementById('student-birth-place').value.trim());
    formData.append('receiptFile', selectedFile);

    try {
      // 2. استدعاء طبقة الـ API المعتمدة
      const response = await Api.submitRegistration(formData);

      if (response && response.success) {
        // 3. عرض شاشة النجاح وتحديث بياناتها
        showSuccessModal(response);
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
  function showSuccessModal(response) {
    const modal = document.getElementById('registration-success-modal');
    if (!modal) return;

    const studentName = document.getElementById('student-name-ar').value.trim();
    const courseSelect = document.getElementById('student-course-select');
    const courseTitle = courseSelect.options[courseSelect.selectedIndex]?.getAttribute('data-title') || courseSelect.value;
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
