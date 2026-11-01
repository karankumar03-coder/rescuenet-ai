import time
import requests

API = "http://127.0.0.1:8000"

reports = [
    ("Sector 62 mein bus aur truck ki takkar, 4 log ghayal", 28.627, 77.372),
    ("Knowledge Park mein hostel ki building mein aag lagi hai, students andar fase hain", 28.468, 77.490),
    ("Sector 18 market mein ek aadmi ko heart attack aaya hai, behosh hai", 28.570, 77.325),
    ("Greater Noida mein nala overflow, ghar mein paani bhar gaya, bujurg fase hain", 28.475, 77.500),
    ("Sector 62 ke paas bike slip ho gayi, ek ladki ke pair mein chot hai", 28.615, 77.365),
    ("A short circuit fire in an electronics shop near Sector 18, shopkeeper trapped", 28.568, 77.322),
    ("Pregnant woman in labour, no ambulance available near Knowledge Park", 28.472, 77.495),
    ("Road par ek gaay ghayal padi hai, traffic slow hai", 28.560, 77.340),
    ("Gas cylinder leak in a house in Sector 62, family of five inside", 28.620, 77.368),
    ("Car accident on expressway, three cars collided, multiple injured", 28.520, 77.420),
]

for text, lat, lng in reports:
    r = requests.post(
        f"{API}/incidents",
        json={"description": text, "latitude": lat, "longitude": lng},
        timeout=120,
    )
    data = r.json()
    print(r.status_code, data.get("incident_type"), data.get("priority_score"), "|", text[:45])
    time.sleep(4)

print("Demo data ready")