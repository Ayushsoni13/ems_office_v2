import json
import urllib.request
import urllib.error

url = 'http://127.0.0.1:8000/api/auth/login'
data = json.dumps({'email': 'boss@ems.com', 'password': 'password123'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=5) as r:
        print('OK')
        print(r.read().decode())
except urllib.error.HTTPError as e:
    print('ERR', e.code)
    print(e.read().decode())
except Exception as e:
    print('ERROR', e)
