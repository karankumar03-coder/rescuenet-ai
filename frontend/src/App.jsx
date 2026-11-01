import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Siren,
  Flame,
  Ambulance,
  Car,
  Waves,
  AlertTriangle,
  Send,
  Zap,
  CheckCircle2,
  Clock,
  Activity,
  LocateFixed,
  Truck,
  MapPin,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

const TYPE_STYLE = {
  fire: { Icon: Flame, bg: "#fee2e2", color: "#dc2626" },
  medical: { Icon: Ambulance, bg: "#dcfce7", color: "#16a34a" },
  accident: { Icon: Car, bg: "#ffedd5", color: "#ea580c" },
  flood: { Icon: Waves, bg: "#dbeafe", color: "#2563eb" },
};
const DEFAULT_TYPE = { Icon: AlertTriangle, bg: "#f1f5f9", color: "#64748b" };

function priorityColor(score) {
  if (score >= 60) return "#dc2626";
  if (score >= 35) return "#f59e0b";
  return "#16a34a";
}

function App() {
  const [incidents, setIncidents] = useState([]);
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [assignments, setAssignments] = useState([]);

  const loadIncidents = () => {
    fetch(`${API}/incidents`)
      .then((res) => res.json())
      .then((data) => setIncidents(data));
    fetch(`${API}/assignments`)
      .then((res) => res.json())
      .then((data) => setAssignments(data));
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Your browser does not support location");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(5));
        setLongitude(pos.coords.longitude.toFixed(5));
      },
      () => alert("Could not get location. Please allow location access.")
    );
  };

  const submitReport = async () => {
    if (!description.trim()) return;
    setLoading(true);
    await fetch(`${API}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      }),
    });
    setDescription("");
    setLatitude("");
    setLongitude("");
    setLoading(false);
    loadIncidents();
  };

  const changeStatus = async (id, status) => {
    await fetch(`${API}/incidents/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadIncidents();
  };

  const getSuggestion = async (id) => {
    const res = await fetch(`${API}/incidents/${id}/recommend`);
    const data = await res.json();
    setSuggestions((prev) => ({ ...prev, [id]: data }));
  };

  const dispatchAll = async () => {
    const res = await fetch(`${API}/dispatch`, { method: "POST" });
    const data = await res.json();
    alert(`Dispatch complete: ${data.length} incident(s) processed`);
    loadIncidents();
  };

  const count = (status) => incidents.filter((i) => i.status === status).length;

  const onMap = incidents.filter(
    (i) => i.latitude !== null && i.longitude !== null
  );

  const stats = [
    { label: "Total incidents", value: incidents.length, Icon: Activity, bg: "#eef2ff", color: "#4f46e5" },
    { label: "Pending", value: count("Pending"), Icon: Clock, bg: "#fff4e5", color: "#b45309" },
    { label: "Assigned", value: count("Assigned"), Icon: Truck, bg: "#eaf1ff", color: "#1d4ed8" },
    { label: "Resolved", value: count("Resolved"), Icon: CheckCircle2, bg: "#e8f7ee", color: "#15803d" },
  ];

  return (
    <div className="app">
      <div className="header">
        <div className="brand">
          <div className="logo">
            <Siren size={24} />
          </div>
          <div>
            <h1>RescueNet AI</h1>
            <p>AI-powered emergency response coordination</p>
          </div>
        </div>
        <div className="live">
          <span className="live-dot" />
          System live
        </div>
      </div>

      <div className="stats">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              <s.Icon size={22} />
            </div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="layout">
        <div>
          <div className="card map-wrap">
            <h3 className="card-title">
              <MapPin size={18} /> Live emergency map
            </h3>
            <MapContainer
              center={[28.55, 77.35]}
              zoom={11}
              style={{ height: 360 }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {onMap.map((i) => (
                <CircleMarker
                  key={i.id}
                  center={[i.latitude, i.longitude]}
                  radius={10}
                  pathOptions={{
                    color: priorityColor(i.priority_score),
                    fillOpacity: 0.7,
                  }}
                >
                  <Popup>
                    <b>{i.incident_type}</b> | Priority: {i.priority_score}
                    <br />
                    {i.ai_summary || i.description}
                    <br />
                    Status: {i.status}
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">
                <Activity size={18} /> Incidents (highest priority first)
              </h3>
              <button className="btn btn-dispatch" onClick={dispatchAll}>
                <Zap size={16} /> Auto Dispatch
              </button>
            </div>

            {incidents.map((i) => {
              const t = TYPE_STYLE[i.incident_type] || DEFAULT_TYPE;
              const TypeIcon = t.Icon;
              const sent = assignments.filter((a) => a.incident_id === i.id);
              return (
                <div
                  key={i.id}
                  className={`incident ${i.status === "Resolved" ? "resolved" : ""}`}
                  style={{ borderLeftColor: priorityColor(i.priority_score) }}
                >
                  <div className="incident-top">
                    <div className="incident-left">
                      <div className="type-icon" style={{ background: t.bg, color: t.color }}>
                        <TypeIcon size={20} />
                      </div>
                      <div>
                        <div className="type-name">{i.incident_type}</div>
                        <div className="stat-label">
                          Severity {i.severity} | Priority {i.priority_score}
                        </div>
                      </div>
                    </div>
                    <div className="pills">
                      <span className={`pill pill-${i.status.toLowerCase()}`}>
                        {i.status}
                      </span>
                    </div>
                  </div>

                  <p className="incident-desc">{i.description}</p>
                  <p className="incident-summary">{i.ai_summary}</p>

                  <div className="actions">
                    <button
                      className="btn"
                      disabled={i.status !== "Pending"}
                      onClick={() => changeStatus(i.id, "Assigned")}
                    >
                      Assign
                    </button>
                    <button
                      className="btn btn-success"
                      disabled={i.status === "Resolved"}
                      onClick={() => changeStatus(i.id, "Resolved")}
                    >
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                    <button className="btn btn-info" onClick={() => getSuggestion(i.id)}>
                      Suggest resources
                    </button>
                  </div>

                  {sent.length > 0 && (
                    <div className="res-box dispatched">
                      <b>Dispatched resources</b>
                      {sent.map((a, idx) => (
                        <div key={idx}>
                          {a.resource_name} ({a.resource_type})
                        </div>
                      ))}
                    </div>
                  )}

                  {suggestions[i.id] && (
                    <div className="res-box suggested">
                      <b>Suggested resources</b>
                      {suggestions[i.id].length === 0 ? (
                        <div>No resource found (missing location or none available)</div>
                      ) : (
                        suggestions[i.id].map((r) => (
                          <div key={r.resource_id}>
                            {r.name} ({r.type}) - {r.distance_km} km away
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="card">
            <h3 className="card-title">
              <Siren size={18} /> New emergency report
            </h3>
            <div className="form">
              <textarea
                rows={4}
                placeholder="Describe the emergency (English, Hindi or Hinglish)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="form-row">
                <input
                  placeholder="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                />
                <input
                  placeholder="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                />
              </div>
              <button className="btn" onClick={useMyLocation}>
                <LocateFixed size={16} /> Use my current location
              </button>
              <button
                className="btn btn-primary"
                onClick={submitReport}
                disabled={loading}
              >
                <Send size={16} />
                {loading ? "AI is analyzing..." : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;