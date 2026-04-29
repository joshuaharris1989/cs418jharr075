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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setMsg("Update failed");
        return;
      }

      // reload records after update
      const updated = await fetch(
        API + "/advising/admin/all/list?t=" + Date.now(),
        { cache: "no-store" }
      );

      const data = await updated.json();
      setRecords(data);
    } catch (err) {
      setMsg("Server error");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Admin Advising Panel</h2>

      {msg && <p style={{ color: "red" }}>{msg}</p>}

      <table border="1" width="100%" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Term</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="4">No records found</td>
            </tr>
          ) : (
            records.map((r) => (
              <tr key={r.advising_id}>
                <td>
                  {r.u_first_name} {r.u_last_name}
                </td>
                <td>{r.current_term}</td>
                <td>{r.status}</td>
                <td>
                  <button
                    onClick={() =>
                      changeStatus(r.advising_id, "approved")
                    }
                  >
                    Approve
                  </button>

                  <button
                    onClick={() =>
                      changeStatus(r.advising_id, "rejected")
                    }
                    style={{ marginLeft: "10px" }}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminAdvising;