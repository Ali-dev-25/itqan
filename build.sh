#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "🎨 Collecting static files..."
python backend/manage.py collectstatic --no-input

echo "🗄️ Applying database migrations..."
python backend/manage.py migrate

echo "👤 Creating admin user..."
python backend/manage.py shell <<EOF
from django.contrib.auth import get_user_model
import os

User = get_user_model()

username = os.environ.get("DJANGO_SUPERUSER_USERNAME") or "itqan_admin"
email = os.environ.get("DJANGO_SUPERUSER_EMAIL") or "admin@itqan-platform.com"
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD") or "Itqan#Admin2026!Secure"

u, created = User.objects.get_or_create(username=username, defaults={'email': email})
u.set_password(password)
u.is_superuser = True
u.is_staff = True
u.save()
if created:
    print("✅ Superuser created successfully!")
else:
    print("✅ Superuser updated successfully!")

EOF

echo "✅ Build completed successfully!"
