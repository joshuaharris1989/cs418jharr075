import { useState } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import AdvisingHistory from "./AdvisingHistory";
import AdvisingForm from "./AdvisingForm";
import "./App.css";
import Dashboard from "./Dashboard.jsx";
import Header from "./Header.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import VerifyOtp from "./VerifyOtp.jsx";
import AdminAdvising from "./AdminAdvising.jsx";

function ResetPasswordInline() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleReset(e) {
    e.preventDefault();
    setMsg("");

    if (newPassword.trim().length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.message || "Could not reset password");
        return;
      }

      setMsg(data.message || "Password updated");

      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch (err) {
      setMsg("Server error");
    }
  }

  if (!email || !token) {
    return <div style={{ padding: 20 }}>Invalid reset link.</div>;
  }

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", padding: 20 }}>
      <h2>Reset Password</h2>
      <p>{email}</p>

      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit" style={{ marginTop: 10 }}>
          Reset Password
        </button>
      </form>

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}

function App() {
  const registerUser = async (payload) => {
    const res = await fetch(import.meta.env.VITE_API_KEY + "user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(json?.message || "Registration failed");
    }

    return json;
  };

  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup onRegister={registerUser} />} />
          <Route path="/reset-password" element={<ResetPasswordInline />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/advising" element={<AdvisingHistory />} />
          <Route path="/advising/:id" element={<AdvisingForm />} />
          <Route path="/advising/new" element={<AdvisingForm />} />
          <Route path="/admin/advising" element={<AdminAdvising />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;