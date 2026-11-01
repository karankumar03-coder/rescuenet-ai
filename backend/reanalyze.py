import time
from database import SessionLocal
import models
from ai_service import analyze_incident

db = SessionLocal()

broken = (
    db.query(models.Incident)
    .filter(models.Incident.incident_type == "unknown")
    .all()
)
print("Dobara analyze hone wale reports:", len(broken))

for incident in broken:
    ai = analyze_incident(incident.description)

    if ai["incident_type"] == "unknown":
        print("Phir fail:", incident.description[:45])
    else:
        incident.incident_type = ai["incident_type"]
        incident.severity = ai["severity"]
        incident.people_at_risk = ai["people_at_risk"]
        incident.ai_summary = ai["summary"]
        incident.priority_score = ai["severity"] * 5 + ai["people_at_risk"] * 3
        db.commit()
        print("Theek hua:", ai["incident_type"], incident.priority_score, "|", incident.description[:45])

    time.sleep(15)

db.close()
print("Ho gaya")