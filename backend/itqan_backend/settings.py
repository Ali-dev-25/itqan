"""
Django settings for itqan_backend project.
إعدادات مشروع Backend منصة إتقان (جاهز للتشغيل المحلي والنشر على Render)
"""

from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# المسار الجذر لمشروع الـ Frontend (المجلد الأب للـ backend)
FRONTEND_DIR = BASE_DIR.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-9^62bnnac1*u3gdk@c0hgdrn5^p&^kq$pmr1*gf-cy6=0iw+-f')

# يتم تعطيل DEBUG تلقائياً عند النشر إذا تم تعيين متغير البيئة RENDER
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1')

ALLOWED_HOSTS = ['*']

CSRF_TRUSTED_ORIGINS = [
    'https://*.onrender.com',
    'https://*.pythonanywhere.com',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
]


# ============================================================
# Application definition — التطبيقات المثبتة
# ============================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'corsheaders',

    # Local apps
    'registrations',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',     # WhiteNoise لخدمة الملفات الثابتة في الإنتاج
    'corsheaders.middleware.CorsMiddleware',          # CORS — يجب أن يكون قبل CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'itqan_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [FRONTEND_DIR],  # لتقديم صفحات الـ Frontend
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'itqan_backend.wsgi.application'


# ============================================================
# Database — قاعدة البيانات (SQLite محلياً / PostgreSQL على Render)
# ============================================================

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    try:
        import dj_database_url
        DATABASES = {
            'default': dj_database_url.config(
                default=DATABASE_URL,
                conn_max_age=600,
                conn_health_checks=True
            )
        }
    except ImportError:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# ============================================================
# Password validation
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ============================================================
# Internationalization — اللغة والتوقيت
# ============================================================

LANGUAGE_CODE = 'ar'
TIME_ZONE = 'Asia/Aden'
USE_I18N = True
USE_TZ = True


# ============================================================
# Static files — الملفات الثابتة (CSS, JavaScript, Images)
# ============================================================

STATIC_URL = '/assets/'
STATICFILES_DIRS = [
    FRONTEND_DIR / 'assets',  # مجلد assets الخاص بالـ Frontend
]

STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise storage لضغط الملفات الثابتة وتخزينها
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ============================================================
# Media files — ملفات الرفع (سندات الدفع)
# ============================================================

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# ============================================================
# Django REST Framework — إعدادات DRF
# ============================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.JSONParser',
    ],
}


# ============================================================
# CORS — السماح بطلبات الـ Frontend
# ============================================================

CORS_ALLOW_ALL_ORIGINS = True  # للتطوير والنشر


# ============================================================
# Excel Export — إعدادات تصدير الإكسل
# ============================================================

EXPORTS_DIR = BASE_DIR / 'exports'
os.makedirs(EXPORTS_DIR, exist_ok=True)


# ============================================================
# File Upload — إعدادات رفع الملفات
# ============================================================

# الحد الأقصى لحجم الملف المرفوع: 5 ميجابايت
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024  # 5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024   # 5MB


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
