import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL = "gemini-3.5-flash"

report = "Sector 62 mein road accident, do log ghayal hain"

prompt = f"""
Tum ek emergency triage assistant ho.
Neeche diye gaye emergency report ko analyze karo.

Report: "{report}"

Sirf JSON do, is format mein:
{{
  "incident_type": "fire, accident, medical, flood ya other mein se ek",
  "severity": 1 se 10 ke beech ka number (10 sabse serious),
  "people_at_risk": khatre mein logon ki anumaanit sankhya (number),
  "summary": "ek chhoti line mein saar",
  "reason": "severity itni kyun di, ek line mein"
}}
"""

response = client.models.generate_content(
    model=MODEL,
    contents=prompt,
    config=types.GenerateContentConfig(response_mime_type="application/json"),
)

print(response.text)