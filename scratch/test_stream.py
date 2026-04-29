import requests

url = "http://localhost:8082/v1/query/stream"
payload = {
    "question": "What ID do I need to vote in Texas?",
    "region": "US",
    "mode": "ballot",
    "language": "en",
}

print(f"Sending request to {url}...")
try:
    response = requests.post(url, json=payload, stream=True, timeout=10)
    print(f"Response Status: {response.status_code}")
    for line in response.iter_lines():
        if line:
            print(f"Received: {line.decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
