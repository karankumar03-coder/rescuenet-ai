import sys
from database import SessionLocal
import models

db = SessionLocal()

if len(sys.argv) == 1:
    incidents = db.query(models.Incident).order_by(models.Incident.id).all()
    for i in incidents:
        print(i.id, "|", i.incident_type, "|", i.priority_score, "|", i.description[:60])
else:
    for arg in sys.argv[1:]:
        incident_id = int(arg)
        db.query(models.Assignment).filter(
            models.Assignment.incident_id == incident_id
        ).delete()
        db.query(models.Incident).filter(
            models.Incident.id == incident_id
        ).delete()
    db.commit()
    print("Deleted incident IDs:", sys.argv[1:])

db.close()