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

username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

if username and email and password:
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        print("✅ Superuser created successfully!")
    else:
        print("ℹ️ Superuser already exists.")
else:
    print("⚠️ Admin environment variables are not set.")

EOF

echo "✅ Build completed successfully!"
