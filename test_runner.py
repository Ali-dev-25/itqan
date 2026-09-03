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

add_field('fullNameAr', 'شالؠ اختبار مححدت')
add_field('fullNameEn', 'Test Student')
add_field('email', 'test_' + str(random.randint(1000,9999)) + '@example.com')
add_field('phone', '770000111')
add_field('gender', 'male')
add_field('qualification', 'bachelor')
add_field('courseId', 'C001')
add_field('experienceLevel', 'beginner')

body.append(('--' + boundary).encode('utf-8'))
body.append(b'Content-Disposition: form-data; name="paymentReceipt"; filename="receipt_test.jpg"')
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
    print('API ERROR:', e.read().decode('utf-8') if hasattr(e, 'read') else e)
