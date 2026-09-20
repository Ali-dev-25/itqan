import urllib.request, json, random

base = 'http://127.0.0.1:8000'

urls = [
    '/',
    '/index.html',
    '/register.html',
    '/fatin.html',
    '/fatin_voice_test.html',
    '/assets/css/design-system.css',
    '/assets/css/public.css',
    '/assets/css/fatin.css',
    '/assets/css/register.css',
    '/assets/images/logo.png',
    '/assets/images/fatin/greeting.webp',
    '/assets/images/fatin/reading-professional.webp',
    '/assets/audio/fatin/scene1_intro.mp3',
    '/assets/audio/fatin/scene3_about.mp3',
    '/assets/js/components/fatin.js',
    '/assets/js/pages/home.js',
    '/assets/js/pages/register.js',
    '/assets/js/utils/api.js',
    '/assets/js/data/courses.js'
]

print('=== 1. TESTING GET ENDPOINTS & STATIC ASSETS ===')
for path in urls:
    try:
        req = urllib.request.urlopen(base + path)
        print("SUCCESS: " + path + " -> " + str(req.status) + " (" + str(len(req.read())) + " bytes)")
    except Exception as e:
        print("FAIL: " + path + " -> " + str(e))

print('\n=== 2. TESTING API POST REGISTRATION ===')
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = []

def add_field(name, val):
    body.append(('--' + boundary).encode('utf-8'))
    body.append(('Content-Disposition: form-data; name="' + name + '"').encode('utf-8'))
    body.append(b'')
    body.append(str(val).encode('utf-8'))

add_field('fullNameAr', 'طالب اختبار محاكاة')
add_field('fullNameEn', 'Test Student')
add_field('phone', '77' + str(random.randint(1000000, 9999999)))
add_field('residenceLocation', 'inside_yemen')
add_field('attendanceMode', 'in_person')
add_field('birthDate', '2001-08-12')
add_field('birthPlace', 'مأرب')
add_field('courseId', 'C001_CPP_BASICS')
add_field('courseTitle', 'أساسيات البرمجة بلغة C++ وحل المشكلات')

body.append(('--' + boundary).encode('utf-8'))
body.append(b'Content-Disposition: form-data; name="receiptFile"; filename="receipt_test.jpg"')
body.append(b'Content-Type: image/jpeg')
body.append(b'')
body.append(b'DUMMY_IMAGE_DATA')
body.append(('--' + boundary + '--').encode('utf-8'))
body.append(b'')

payload = b'\r\n'.join(body)

req = urllib.request.Request(
    base + '/api/v1/registrations/',
    data=payload,
    headers={'Content-Type': 'multipart/form-data; boundary=' + boundary},
    method='POST'
)
try:
    res = urllib.request.urlopen(req)
    print('API SUCCESS:', json.dumps(json.loads(res.read().decode('utf-8')), ensure_ascii=False, indent=2))
except Exception as e:
    err_text = e.read().decode('utf-8') if hasattr(e, 'read') else str(e)
    print('API ERROR:', err_text.encode('ascii', errors='replace').decode())
