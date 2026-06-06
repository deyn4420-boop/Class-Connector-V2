import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'http://127.0.0.1:5000/api/login',
    data=json.dumps({"email":"mayur2424mayur@gmail.com", "password":"password123"}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("BODY:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print("ERROR BODY:", e.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", e)
