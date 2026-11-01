from database import SessionLocal
import models

db = SessionLocal()

db.query(models.Assignment).delete()

for resource in db.query(models.Resource).all():
    resource.available = True

for incident in db.query(models.Incident).all():
    incident.status = "Pending"

db.commit()
db.close()

print("Demo reset ho gaya: saare incidents Pending, saare saadhan khali")