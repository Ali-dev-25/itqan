/**
 * ITQAN — Toast Notifications Component
 * نظام الإشعارات المنبثقة
 */
const Toast = (() => {
  let container = null;

  function ensureContainer() {
    if (!container) {
      container = document.querySelector('.toast-container');
      if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function getIcon(type) {
    switch (type) {
      case 'success':
        return '<i data-lucide="check-circle"></i>';
      case 'warning':
        return '<i data-lucide="alert-triangle"></i>';
      case 'danger':
        return '<i data-lucide="alert-circle"></i>';
      case 'info':
      default:
        return '<i data-lucide="info"></i>';
    }
  }

  function show({ title = '', message = '', type = 'info', duration = 3500 }) {
    const parent = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
      <div class="toast-icon">
        ${getIcon(type)}
      </div>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${Helpers.escape(title)}</div>` : ''}
        ${message ? `<div class="toast-msg">${Helpers.escape(message)}</div>` : ''}
      </div>
      <button class="toast-close" type="button" aria-label="إغلاق">
        <i data-lucide="x"></i>
      </button>
    `;

    parent.appendChild(toast);
    if (window.lucide) {
      lucide.createIcons({ root: toast });
    }

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const close = () => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', close);

    if (duration > 0) {
      setTimeout(close, duration);
    }
  }

  return {
    show,
    success: (msg, title = 'تم بنجاح') => show({ title, message: msg, type: 'success' }),
    error: (msg, title = 'حدث خطأ') => show({ title, message: msg, type: 'danger' }),
    warning: (msg, title = 'تنبيه') => show({ title, message: msg, type: 'warning' }),
    info: (msg, title = 'معلومة') => show({ title, message: msg, type: 'info' })
  };
})();
