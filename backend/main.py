from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import engine, Base, SessionLocal
import models
from ai_service import analyze_incident
from dispatch import recommend_resources, auto_dispatch

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://rescuenet-ai-nu.vercel.app"],
    
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class IncidentCreate(BaseModel):
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


def calculate_priority(severity: int, people_at_risk: int) -> float:
    return severity * 5 + people_at_risk * 3


@app.get("/")
def home():
    return {"message": "RescueNet AI backend chal raha hai"}


@app.post("/incidents")
def create_incident(data: IncidentCreate, db: Session = Depends(get_db)):
    ai = analyze_incident(data.description)
    score = calculate_priority(ai["severity"], ai["people_at_risk"])

    incident = models.Incident(
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        incident_type=ai["incident_type"],
        severity=ai["severity"],
        people_at_risk=ai["people_at_risk"],
        ai_summary=ai["summary"],
        priority_score=score,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@app.get("/incidents")
def list_incidents(db: Session = Depends(get_db)):
    return (
        db.query(models.Incident)
        .order_by(models.Incident.priority_score.desc())
        .all()
    )

    
class StatusUpdate(BaseModel):
         status: str

@app.patch("/incidents/{incident_id}/status")
def update_status(
    incident_id: int, data: StatusUpdate, db: Session = Depends(get_db)
):
    allowed = ["Pending", "Assigned", "Resolved"]
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid status")

    incident = (
        db.query(models.Incident)
        .filter(models.Incident.id == incident_id)
        .first()
    )
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = data.status

    if data.status == "Resolved":
        assignments = (
            db.query(models.Assignment)
            .filter(models.Assignment.incident_id == incident_id)
            .all()
        )
        for a in assignments:
            resource = (
                db.query(models.Resource)
                .filter(models.Resource.id == a.resource_id)
                .first()
            )
            if resource is not None:
                resource.available = True

    db.commit()
    db.refresh(incident)
    return incident


@app.get("/incidents/{incident_id}/recommend")
def recommend(incident_id: int, db: Session = Depends(get_db)):
    incident = (
        db.query(models.Incident)
        .filter(models.Incident.id == incident_id)
        .first()
    )
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    return recommend_resources(db, incident)


@app.post("/dispatch")
def dispatch_all(db: Session = Depends(get_db)):
    return auto_dispatch(db)


@app.get("/assignments")
def list_assignments(db: Session = Depends(get_db)):
    rows = (
        db.query(models.Assignment, models.Resource)
        .join(models.Resource, models.Assignment.resource_id == models.Resource.id)
        .all()
    )
    return [
        {
            "incident_id": a.incident_id,
            "resource_name": r.name,
            "resource_type": r.resource_type,
        }
        for a, r in rows
    ]