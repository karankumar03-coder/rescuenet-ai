from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)

resources = [
    ("Ambulance A1 (Sector 18)", "ambulance", 28.570, 77.325),
    ("Ambulance A2 (Sector 62)", "ambulance", 28.627, 77.372),
    ("Ambulance A3 (Greater Noida)", "ambulance", 28.475, 77.500),
    ("Fire Truck F1 (Knowledge Park)", "fire_truck", 28.468, 77.490),
    ("Fire Truck F2 (Sector 62)", "fire_truck", 28.615, 77.365),
    ("Police Unit P1 (Sector 18)", "police", 28.568, 77.322),
    ("Police Unit P2 (Knowledge Park)", "police", 28.472, 77.495),
]

db = SessionLocal()

if db.query(models.Resource).count() == 0:
    for name, rtype, lat, lng in resources:
        db.add(
            models.Resource(
                name=name,
                resource_type=rtype,
                latitude=lat,
                longitude=lng,
                available=True,
            )
        )
    db.commit()
    print("Resources add ho gaye:", len(resources))
else:
    print("Resources pehle se maujood hain, kuch nahi badla")

db.close()