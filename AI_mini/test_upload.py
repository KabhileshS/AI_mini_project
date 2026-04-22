import requests

url = "http://localhost:8000/upload"
files = {'file': ('sample_statement.pdf', open('sample_statement.pdf', 'rb'), 'application/pdf')}
response = requests.post(url, files=files)

print("Status Code:", response.status_code)
print("Response:", response.text)
