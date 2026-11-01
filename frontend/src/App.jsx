import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const API = "http://127.0.0.1:8000";

function priorityColor(score) {
  if (score >= 60) return "#d32f2f";
  if (score >= 35) return "#f57c00";
  return "#388e3c";
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
    alert(`${data.length} emergency ko saadhan baante gaye`);
    loadIncidents();
  };

  const onMap = incidents.filter(
    (i) => i.latitude !== null && i.longitude !== null
  );

  return (
    <div style={{ padding: 20, textAlign: "left" }}>
      <h1>RescueNet AI Dashboard</h1>

      <MapContainer
        center={[28.55, 77.35]}
        zoom={11}
        style={{ height: 350, marginBottom: 20 }}
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

      <div style={{ border: "1px solid #888", padding: 12, marginBottom: 20 }}>
        <h3>Naya Emergency Report</h3>
        <textarea
          rows={3}
          style={{ width: "100%" }}
          placeholder="Kya hua? (Hindi, English ya Hinglish)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          placeholder="Latitude (e.g. 28.62)"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />
        <input
          placeholder="Longitude (e.g. 77.36)"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
        />
        <button onClick={submitReport} disabled={loading}>
          {loading ? "AI analyze kar raha hai..." : "Report Submit Karo"}
        </button>
      </div>

            <button onClick={dispatchAll} style={{ marginBottom: 12 }}>
        Auto Dispatch (Priority ke hisaab se)
      </button>
      {incidents.map((i) => (
        <div
          key={i.id}
          style={{
            border: "1px solid #ccc",
            borderLeft: `8px solid ${priorityColor(i.priority_score)}`,
            padding: 10,
            marginBottom: 10,
            opacity: i.status === "Resolved" ? 0.5 : 1,
          }}
        >
          <b>{i.incident_type}</b> | Severity: {i.severity} | Priority:{" "}
          {i.priority_score} | {i.status}
          <p>{i.description}</p>
          <small>{i.ai_summary}</small>
          <div style={{ marginTop: 8 }}>
            <button
              disabled={i.status !== "Pending"}
              onClick={() => changeStatus(i.id, "Assigned")}
            >
              Assign
            </button>
            <button
              disabled={i.status === "Resolved"}
              onClick={() => changeStatus(i.id, "Resolved")}
            >
              Resolve
            </button>
            <button onClick={() => getSuggestion(i.id)}>
              Rescue Suggest Karo
            </button>
          </div>
                    {assignments.filter((a) => a.incident_id === i.id).length > 0 && (
            <div style={{ marginTop: 8, background: "#e8f5e9", padding: 8 }}>
              <b>Bheje gaye saadhan:</b>
              {assignments
                .filter((a) => a.incident_id === i.id)
                .map((a, idx) => (
                  <div key={idx}>
                    {a.resource_name} ({a.resource_type})
                  </div>
                ))}
            </div>
          )}

          {suggestions[i.id] && (
            <div style={{ marginTop: 8, background: "#eef6ff", padding: 8 }}>
              <b>Sujhaye gaye saadhan:</b>
              {suggestions[i.id].length === 0 ? (
                <div>Koi saadhan nahi mila (location ya khali saadhan nahi)</div>
              ) : (
                suggestions[i.id].map((r) => (
                  <div key={r.resource_id}>
                    {r.name} ({r.type}) - {r.distance_km} km door
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default App;