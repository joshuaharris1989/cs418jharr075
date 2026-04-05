import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem("loggedInUser");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changeMsg, setChangeMsg] = useState("");

  async function handleChangePassword(e) {
    e.preventDefault();
    setChangeMsg("");

    try {
      const res = await fetch("http://localhost:3000/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          u_email: user.u_email,
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setChangeMsg(data.message || "Could not change password");
        return;
      }

      setChangeMsg(data.message || "Password updated");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setChangeMsg("Server error");
    }
  }

  function handleLogout() {
    localStorage.removeItem("loggedInUser");
    navigate("/login", { replace: true });
  }

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
        <h2>Dashboard</h2>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate("/advising")}
            style={{ padding: "10px 14px", cursor: "pointer" }}
          >
            Course Advising
          </button>

          {user.u_is_admin === 1 && (
            <button
              onClick={() => navigate("/admin/advising")}
              style={{ padding: "10px 14px", cursor: "pointer" }}
            >
              Admin Advising
            </button>
          )}

          <button
            onClick={handleLogout}
            style={{ padding: "10px 14px", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10,
          marginBottom: 20
        }}
      >
        <h3>Logged-in User Info</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            rowGap: 10
          }}
        >
          <strong>First Name</strong>
          <span>{user.u_first_name}</span>

          <strong>Last Name</strong>
          <span>{user.u_last_name}</span>

          <strong>Email</strong>
          <span>{user.u_email}</span>

          <strong>Admin</strong>
          <span>{user.u_is_admin === 1 ? "Yes" : "No"}</span>
        </div>
      </div>

      <div
        style={{
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 10
        }}
      >
        <h3>Change Password</h3>

        <form onSubmit={handleChangePassword}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              rowGap: 10
            }}
          >
            <label htmlFor="oldPassword">Old Password</label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            style={{ marginTop: 10, padding: "10px 14px", cursor: "pointer" }}
          >
            Change Password
          </button>

          {changeMsg && (
            <p
              style={{
                color: changeMsg.toLowerCase().includes("updated") ? "green" : "red",
                marginTop: 10
              }}
            >
              {changeMsg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}