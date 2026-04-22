import os
from dotenv import load_dotenv
load_dotenv()

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend import gemini_service

with open('sample_statement.pdf', 'rb') as f:
    file_bytes = f.read()

try:
    print("Uploading first time...")
    res1 = gemini_service.extract_from_pdf(file_bytes, 'application/pdf')
    print("First upload success!")
except Exception as e:
    import traceback
    traceback.print_exc()

try:
    print("Uploading second time...")
    res2 = gemini_service.extract_from_pdf(file_bytes, 'application/pdf')
    print("Second upload success!")
except Exception as e:
    import traceback
    traceback.print_exc()
