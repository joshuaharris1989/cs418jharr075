import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_KEY;

function AdminAdvising() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [msg, setMsg] = useState("");

  const savedUser = localStorage.getItem("loggedInUser");
  const user = savedUser ? JSON.parse(savedUser) : null;

  useEffect(() => {
    async function loadRecords() {
      try {
        const res = await fetch(
          API + "/advising/admin/all/list?t=" + Date.now(),
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!res.ok) {
          setMsg("Could not load records.");
          return;
        }

        setRecords(data);
      } catch (err) {
        setMsg("Server error");
      }
    }

    loadRecords();
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.u_is_admin !== 1) {
    return <Navigate to="/dashboard" replace />;
  }

  async function changeStatus(id, newStatus) {
    setMsg("");

    try {
      const res = await fetch(API + "/advising/admin/status/" + id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.error || "Could not update status.");
        return;
      }

      const updated = records.map((record) => {
        if (record.advising_id === id) {
          return { ...record, status: newStatus };
        }
        return record;
      });

      setRecords(updated);
    } catch (err) {
      setMsg("Server error");
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20
        }}
      >
        <h2>Admin Advising Review</h2>
        <button onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
      </div>

      {msg && <p style={{ color: "red" }}>{msg}</p>}

      {records.length === 0 ? (
        <p>No records found.</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th>Student</th>
              <th>Email</th>
              <th>Term</th>
              <th>Status</th>
              <th>Date</th>
              <th>Open</th>
              <th>Approve</th>
              <th>Reject</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record.advising_id}>
                <td>{record.u_first_name} {record.u_last_name}</td>
                <td>{record.u_email}</td>
                <td>{record.current_term}</td>
                <td>{record.status}</td>
                <td>{new Date(record.submitted_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => navigate("/advising/" + record.advising_id)}>
                    View
                  </button>
                </td>
                <td>
                  <button onClick={() => changeStatus(record.advising_id, "approved")}>
                    Approve
                  </button>
                </td>
                <td>
                  <button onClick={() => changeStatus(record.advising_id, "rejected")}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminAdvising;