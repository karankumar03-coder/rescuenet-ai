import os
import json
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3.8-flash",
    "gemini-3.6-flash",
]
MAX_TRIES = 2

FALLBACK = {
    "incident_type": "unknown",
    "severity": 5,
    "people_at_risk": 0,
    "summary": "AI analysis available nahi",
}


def analyze_incident(description: str) -> dict:
    prompt = f"""
Tum ek emergency triage assistant ho.
Neeche diye gaye emergency report ko analyze karo.

Report: "{description}"

Sirf JSON do, is format mein:
{{
  "incident_type": "fire, accident, medical, flood ya other mein se ek",
  "severity": 1 se 10 ke beech ka number (10 sabse serious),
  "people_at_risk": khatre mein logon ki anumaanit sankhya (number),
  "summary": "one short line summary in English"
}}
"""
    for model in MODELS:
        for attempt in range(1, MAX_TRIES + 1):
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    ),
                )
                data = json.loads(response.text)
                return {
                    "incident_type": str(data.get("incident_type", "other")).lower(),
                    "severity": max(1, min(10, int(data.get("severity", 5)))),
                    "people_at_risk": max(0, int(data.get("people_at_risk", 0))),
                    "summary": str(data.get("summary", "")),
                }
            except Exception as e:
                msg = str(e)
                print(f"AI error ({model}, koshish {attempt}/{MAX_TRIES}):", msg[:150])
                if "429" in msg or "RESOURCE_EXHAUSTED" in msg:
                    break
                time.sleep(2 * attempt)

    return dict(FALLBACK)


if __name__ == "__main__":
    print(analyze_incident("Knowledge Park mein building mein aag lagi hai, kai log fase hain"))