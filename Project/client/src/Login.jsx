import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
const API = import.meta.env.VITE_API_KEY;

export default function Login() {
  const [enteredEmail, setEnteredEmail] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const navigate = useNavigate();

  function handleInputChange(identifier, value) {
    if (identifier === "email") setEnteredEmail(value);
    else setEnteredPassword(value);
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    if (!enteredEmail.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    if (enteredPassword.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Call existing login API (NO CHANGE to backend)
      const res = await fetch(import.meta.env.VITE_API_KEY + "user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          u_email: enteredEmail,
          u_password: enteredPassword,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.message || "Login failed");
        return;
      }

      // Step 2: Store email temporarily
      localStorage.setItem("pendingOtpEmail", enteredEmail);

      // Step 3: Redirect to OTP page
      navigate("/verify-otp");
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg("");

    if (!forgotEmail.includes("@")) {
      setForgotMsg("Please enter a valid email.");
      return;
    }

    try {
      const res = await fetch(API + "/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ u_email: forgotEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setForgotMsg(data?.message || "Could not send reset link");
        return;
      }

      setForgotMsg(data?.message || "Reset link sent. Check your email.");
      setForgotEmail("");
    } catch (err) {
      setForgotMsg("Server error");
    }
  };

  const emailNotValid = submitted && !enteredEmail.includes("@");
  const passwordNotValid = submitted && enteredPassword.trim().length < 8;

  return (
    <div id="login">
      {error && (
        <div
          style={{
            background: "#fee",
            padding: 10,
            borderRadius: 6,
            marginBottom: 12,
            border: "1px solid #fca5a5",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="controls">
          <p>
            <label className={emailNotValid ? "invalid" : ""}>Email</label>
            <input
              type="email"
              value={enteredEmail}
              className={emailNotValid ? "invalid" : ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </p>

          <p>
            <label className={passwordNotValid ? "invalid" : ""}>Password</label>
            <input
              type="password"
              value={enteredPassword}
              className={passwordNotValid ? "invalid" : ""}
              onChange={(e) => handleInputChange("password", e.target.value)}
            />
          </p>
        </div>

        <div className="actions">
          <Link to="/signup" className="button" style={{ textAlign: "center" }}>
            Create a new account
          </Link>

          <button className="button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </form>

      <hr style={{ margin: "20px 0" }} />

      <div>
        <h3>Forgot Password?</h3>

        <form onSubmit={handleForgotPassword}>
          <input
            type="email"
            placeholder="Enter your email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            style={{ padding: 10, width: "100%", maxWidth: 320 }}
          />

          <button
            type="submit"
            className="button"
            style={{ marginTop: 10, width: "fit-content" }}
          >
            Send Reset Link
          </button>
        </form>

        {forgotMsg && <p style={{ marginTop: 10 }}>{forgotMsg}</p>}
      </div>
    </div>
  );
}