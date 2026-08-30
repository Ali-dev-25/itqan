@echo off
chcp 65001 > nul
title منصة إتقان — تشغيل خادم Django الكامل
color 0B

echo =======================================================
echo        🚀 جاري تشغيل منصة إتقان التعليمية (Django Backend)...
echo =======================================================
echo.
echo 🦊 رفيقك «فَطِن» بانتظارك!
echo 🌐 واجهة الموقع: http://localhost:8000/fatin.html
echo 📋 صفحة التسجيل: http://localhost:8000/register.html
echo ⚙️ لوحة الإدارة: http://localhost:8000/admin/
echo 👤 حساب المشرف الافتراضي: admin / admin123
echo.

:: الانتقال إلى مجلد الباكاند
cd /d "%~dp0backend"

:: فتح المتصفح تلقائياً بعد ثانيتين
start "" "http://localhost:8000/fatin.html"

:: تشغيل خادم Django على المنفذ 8000
python manage.py runserver 8000

pause
