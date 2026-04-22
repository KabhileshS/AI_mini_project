import os
from google import genai
from google.genai import types
from schemas import ExpenseExtraction
import tempfile
from typing import List
import json

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")
    return genai.Client(api_key=api_key)

def extract_from_image(file_bytes: bytes, mime_type: str) -> List[ExpenseExtraction]:
    client = get_client()
    prompt = "Extract the expense details from this image. Return a JSON array of expenses."
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
            prompt
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=list[ExpenseExtraction],
            temperature=0.0
        )
    )
    
    try:
        data = json.loads(response.text)
        return [ExpenseExtraction(**item) for item in data]
    except Exception as e:
        print("Error parsing JSON:", e)
        return []

def extract_from_pdf(file_bytes: bytes, mime_type: str) -> List[ExpenseExtraction]:
    client = get_client()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
        
    try:
        uploaded_file = client.files.upload(file=tmp_path)
        prompt = "Extract the expense details from this PDF document. Return a JSON array of expenses."
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                uploaded_file,
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=list[ExpenseExtraction],
                temperature=0.0
            )
        )
        
        try:
            data = json.loads(response.text)
            return [ExpenseExtraction(**item) for item in data]
        except Exception as e:
            print("Error parsing JSON:", e)
            return []
    finally:
        os.remove(tmp_path)

def chat_with_data(message: str, expenses_json: str) -> str:
    client = get_client()
    prompt = f"You are an AI financial assistant. Here is the user's expense data in JSON format: {expenses_json}\n\nAnswer the following question based ONLY on this data: {message}"
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    return response.text
