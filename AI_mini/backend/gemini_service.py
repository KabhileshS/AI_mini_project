import os
from google import genai
from google.genai import types
from schemas import ExpenseExtraction
import tempfile
from typing import List
import json
import groq

def get_chat_response(message: str, context: str):
    providers = ["groq", "gemini"]
    
    for provider in providers:
        try:
            if provider == "gemini":
                # Your existing Gemini logic
                client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=f"Context: {context}\n\nQuestion: {message}"
                )
                return response.text

            elif provider == "groq":
                # Groq (Llama 3) fallback - extremely fast and generous free tier
                client = groq.Groq(api_key=os.getenv("GROQ_API_KEY"))
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": f"{context}\n\n{message}"}]
                )
                return response.choices[0].message.content

        except Exception as e:
            print(f"{provider} failed or limit reached: {e}")
            continue # Move to the next provider in the list
            
    return "All AI providers are currently unavailable. Please try again later."

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
    context = f"You are an AI financial assistant. Here is the user's expense data in JSON format: {expenses_json}"
    prompt_message = f"Answer the following question based ONLY on this data: {message}"
    return get_chat_response(message=prompt_message, context=context)

# Update in AI_mini/backend/gemini_service.py

def generate_dual_summary(current_expenses_json: str, historical_expenses_json: str) -> str:
    """
    Generates a dual-layer summary: one for the immediate upload and one for overall history.
    """
    context = f"""
    You are a professional financial assistant. Analyze two sets of data:
    
    DATASET 1 (Current Upload): {current_expenses_json}
    DATASET 2 (Historical Total): {historical_expenses_json}
    """
    
    message = """
    Please provide:
    1. **Immediate Insight**: A 2-sentence summary of the current upload (Dataset 1). 
       If Dataset 1 is empty or null, state "No current data available for immediate analysis."
    2. **Overall Trends**: A 2-sentence summary of the user's total spending history (Dataset 2).
    3. **Actionable Advice**: One tip based on how the current upload fits into the overall history.
    
    Keep the tone professional yet encouraging.
    """
    
    return get_chat_response(message=message, context=context)