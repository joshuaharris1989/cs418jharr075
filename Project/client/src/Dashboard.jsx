import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const stored = localStorage.getItem("loggedInUser");
  const user = stored ? JSON.parse(stored) : null;
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changeMsg, setChangeMsg] = useState("");
  
   async function handleChangePassword(e) {
    e.preventDefault();
    setChangeMsg("");

    try {
      const res = await fetch("http://localhost:3000/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          u_email: user.u_email,
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();

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

  // If no user, redirect immediately
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard</h2>
        <button onClick={handleLogout} style={{ padding: "10px 14px", cursor: "pointer" }}>
          Logout
        </button>
      </div>

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10 }}>
        <h3>Logged-in User Info</h3>

        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 10 }}>
          
          <strong>First Name</strong> <span>{user.u_first_name}</span>
          <strong>Last Name</strong> <span>{user.u_last_name}</span>
          <strong>Email</strong> <span>{user.u_email}</span>
          
          
        </div>
      </div>
 {/* Copilot generated change password form */}

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 10, marginTop: 20 }}>
        <h3>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 10 }}>
            <label htmlFor="oldPassword">Old Password:</label>
            <input
              type="password"
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <label htmlFor="newPassword">New Password:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <button type="submit" style={{ marginTop: 10, padding: "10px 14px", cursor: "pointer" }}>
            Change Password
          </button>
          {changeMsg && (
            <p style={{ color: changeMsg.includes("updated") ? "green" : "red", marginTop: 10 }}>
              {changeMsg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}