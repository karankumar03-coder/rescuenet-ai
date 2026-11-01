import math
import models

NEEDS = {
    "fire": ["fire_truck", "ambulance"],
    "accident": ["ambulance", "police"],
    "medical": ["ambulance"],
    "flood": ["police", "ambulance"],
}
DEFAULT_NEEDS = ["police"]


def distance_km(lat1, lng1, lat2, lng2):
    r = 6371
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = p2 - p1
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def recommend_resources(db, incident):
    if incident.latitude is None or incident.longitude is None:
        return []

    wanted = NEEDS.get(incident.incident_type, DEFAULT_NEEDS)
    result = []

    for rtype in wanted:
        candidates = (
            db.query(models.Resource)
            .filter(
                models.Resource.resource_type == rtype,
                models.Resource.available.is_(True),
            )
            .all()
        )
        if not candidates:
            continue

        best = min(
            candidates,
            key=lambda r: distance_km(
                incident.latitude, incident.longitude, r.latitude, r.longitude
            ),
        )
        dist = distance_km(
            incident.latitude, incident.longitude, best.latitude, best.longitude
        )
        result.append(
            {
                "resource_id": best.id,
                "name": best.name,
                "type": best.resource_type,
                "distance_km": round(dist, 2),
            }
        )

    return result


def auto_dispatch(db):
    pending = (
        db.query(models.Incident)
        .filter(
            models.Incident.status == "Pending",
            models.Incident.latitude.isnot(None),
            models.Incident.longitude.isnot(None),
        )
        .order_by(models.Incident.priority_score.desc())
        .all()
    )

    report = []
    for incident in pending:
        recs = recommend_resources(db, incident)
        if not recs:
            report.append(
                {
                    "incident_id": incident.id,
                    "priority_score": incident.priority_score,
                    "assigned": [],
                    "note": "No available resource found",
                }
            )
            continue

        for r in recs:
            resource = (
                db.query(models.Resource)
                .filter(models.Resource.id == r["resource_id"])
                .first()
            )
            resource.available = False
            db.add(
                models.Assignment(
                    incident_id=incident.id, resource_id=resource.id
                )
            )

        incident.status = "Assigned"
        db.commit()

        report.append(
            {
                "incident_id": incident.id,
                "priority_score": incident.priority_score,
                "assigned": recs,
            }
        )

    return report