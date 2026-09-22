"""
ITQAN — Registration Unit Tests
اختبارات شاملة لوظائف الـ Backend ونقاط النهاية
"""
import io
from PIL import Image
from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from .models import Registration, Course


class RegistrationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('api-registration-create')
        Course.objects.get_or_create(
            course_id='C001',
            defaults={
                'title': 'تطوير واجهات الويب الحديثة',
                'track': 'تطوير الويب',
                'track_key': 'web',
                'description': 'دورة تطوير الويب الشاملة',
                'duration': 'شهر تدريبي',
                'level': 'مبتدئ',
                'badge': 'دورة أساسيات',
                'status': 'active',
                'allow_in_person': True,
                'allow_online': True,
                'min_students': 10,
                'max_students': 25,
                'price_in_person_current': 20000,
                'price_online_current': 15000,
                'price_certificate': 'شاملة الشهادة',
                'topics': 'HTML, CSS, JS'
            }
        )
        Course.objects.get_or_create(
            course_id='C002',
            defaults={
                'title': 'تصميم UI/UX',
                'track': 'التصميم',
                'track_key': 'design',
                'description': 'دورة تصميم واجهات وتجربة المستخدم',
                'duration': 'شهر تدريبي',
                'level': 'مبتدئ',
                'badge': 'دورة تخصصية',
                'status': 'active',
                'allow_in_person': True,
                'allow_online': True,
                'min_students': 10,
                'max_students': 25,
                'price_in_person_current': 20000,
                'price_online_current': 15000,
                'price_certificate': 'شاملة الشهادة',
                'topics': 'Figma, Prototyping'
            }
        )

    def create_dummy_image(self, name='test_receipt.jpg'):
        """إنشاء صورة وهمية للاختبار"""
        file = io.BytesIO()
        image = Image.new('RGB', (100, 100), color='blue')
        image.save(file, 'jpeg')
        file.seek(0)
        return SimpleUploadedFile(name, file.read(), content_type='image/jpeg')

    def test_successful_registration(self):
        """اختبار تقديم طلب تسجيل صحيح مع سند"""
        image = self.create_dummy_image()
        payload = {
            'fullNameAr': 'أحمد محمد علي السالمي',
            'fullNameEn': 'Ahmed Mohammed Ali',
            'phone': '771234567',
            'residenceLocation': 'inside_yemen',
            'attendanceMode': 'in_person',
            'courseId': 'C001',
            'courseTitle': 'تطوير واجهات الويب الحديثة',
            'birthDate': '2001-05-14',
            'birthPlace': 'صنعاء',
            'receiptFile': image
        }

        response = self.client.post(self.url, payload, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertTrue(response.data['reference'].startswith('ITQ-'))
        self.assertEqual(Registration.objects.count(), 1)
        
        reg = Registration.objects.first()
        self.assertEqual(reg.full_name_ar, 'أحمد محمد علي السالمي')
        self.assertEqual(reg.phone, '771234567')
        self.assertEqual(reg.status, 'pending')

    def test_missing_required_fields(self):
        """اختبار رفض الطلب عند نقص الحقول الإلزامية"""
        payload = {
            'fullNameEn': 'Ahmed Ali',
            # fullNameAr, phone, courseId, receiptFile مفقودة
        }

        response = self.client.post(self.url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('fullNameAr', response.data['errors'])
        self.assertIn('phone', response.data['errors'])
        self.assertIn('courseId', response.data['errors'])

    def test_prevent_duplicate_registration(self):
        """اختبار منع التسجيل المكرر بنفس رقم الهاتف ونفس الدورة"""
        image1 = self.create_dummy_image('receipt1.jpg')
        image2 = self.create_dummy_image('receipt2.jpg')

        payload1 = {
            'fullNameAr': 'علي صالح',
            'fullNameEn': 'Ali Saleh',
            'phone': '770000000',
            'residenceLocation': 'inside_yemen',
            'attendanceMode': 'in_person',
            'courseId': 'C001',
            'courseTitle': 'تطوير واجهات الويب الحديثة',
            'birthDate': '2000-01-01',
            'birthPlace': 'صنعاء',
            'receiptFile': image1
        }
        res1 = self.client.post(self.url, payload1, format='multipart')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # محاولة التسجيل مرة أخرى بنفس الرقم والدورة
        payload2 = {
            'fullNameAr': 'علي صالح',
            'fullNameEn': 'Ali Saleh',
            'phone': '770000000',
            'residenceLocation': 'inside_yemen',
            'attendanceMode': 'in_person',
            'courseId': 'C001',
            'courseTitle': 'تطوير واجهات الويب الحديثة',
            'birthDate': '2000-01-01',
            'birthPlace': 'صنعاء',
            'receiptFile': image2
        }
        res2 = self.client.post(self.url, payload2, format='multipart')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', res2.data['errors'])

    def test_invalid_file_extension(self):
        """اختبار رفض الملفات غير المدعومة مثل .txt أو .exe"""
        fake_file = SimpleUploadedFile("danger.exe", b"binary content", content_type="application/octet-stream")
        payload = {
            'fullNameAr': 'سعيد محمد',
            'fullNameEn': 'Saeed Mohammed',
            'phone': '773333333',
            'residenceLocation': 'inside_yemen',
            'attendanceMode': 'in_person',
            'courseId': 'C002',
            'courseTitle': 'تصميم UI/UX',
            'birthDate': '1999-03-20',
            'birthPlace': 'عدن',
            'receiptFile': fake_file
        }
        response = self.client.post(self.url, payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('receiptFile', response.data['errors'])
