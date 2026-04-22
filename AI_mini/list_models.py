import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

try:
    models = client.models.list()
    for m in models:
        if "gemini-3.1" in m.name or "gemini-1.5" in m.name:
            print(m.name)
except Exception as e:
    print("Error:", e)
