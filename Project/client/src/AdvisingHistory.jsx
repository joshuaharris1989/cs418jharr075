import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_KEY;
function AdvisingHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState("");

  const savedUser = localStorage.getItem("loggedInUser");
  const user = savedUser ? JSON.parse(savedUser) : null;

  useEffect(() => {
    async function loadHistory() {
      if (!user || !user.u_id) {
        return;
      }

      try {
        const res = await fetch(
          API + "/advising/history/" + user.u_id +
            "?t=" +
            Date.now(),
          {
            cache: "no-store"
          }
        );

        if (!res.ok) {
          setMsg("Could not load advising history.");
          return;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setRecords(data);
          setMsg("");
        } else {
          setRecords([]);
          setMsg("Could not load advising history.");
        }
      } catch (err) {
        setMsg("Server error");
      }
    }

    loadHistory();
  }, [user?.u_id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20
        }}
      >
        <h2>Course Advising History</h2>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>

          <button onClick={() => navigate("/advising/new")}>
            New Advising Entry
          </button>
        </div>
      </div>

      {msg && <p style={{ color: "red", marginBottom: 12 }}>{msg}</p>}

      {records.length === 0 ? (
        <div
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 10
          }}
        >
          <p>No advising records found.</p>
        </div>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>Date</th>
              <th>Term</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr
                key={record.advising_id}
                onClick={() => navigate("/advising/" + record.advising_id)}
                style={{ cursor: "pointer" }}
              >
                <td>{new Date(record.submitted_at).toLocaleDateString()}</td>
                <td>{record.term}</td>
                <td>{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdvisingHistory;