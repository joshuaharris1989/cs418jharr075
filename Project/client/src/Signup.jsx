import { useState } from "react";
import Field from "./Field";
import "./Signup.css";

export default function Signup({ onRegister }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    uin: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!/^\d{9}$/.test(form.uin.trim())) e.uin = "UIN must be 9 digits";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (!passwordRegex.test(form.password)) {
        e.password =
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
      }
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMsg("");

    const v = validate();
    setErrors(v);
    console.log("VALIDATION ERRORS:", v);
    if (Object.keys(v).length !== 0) return;

    setIsSubmitting(true);

    try {
      const payload = {
        u_first_name: form.firstName.trim(),
        u_last_name: form.lastName.trim(),
        u_email: form.email.trim().toLowerCase(),
        u_password: form.password,
        uin: form.uin,
      };

      // IMPORTANT: onRegister must return a Promise (fetch/axios)
      await onRegister(payload);

      setStatusMsg("✅ Signup successful! Check your email for the verification link.");

      // optional: clear form after success
      setForm({
        firstName: "",
        lastName: "",
        uin: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // optional: send to login after 2 seconds
      // window.location.href = "/login";
      // or if you use react-router: navigate("/login");
    } catch (err) {
      setStatusMsg(
        "❌ Signup failed. " + (err?.message ? err.message : "Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <h3 className="signup-title">Create Account</h3>

      {statusMsg ? (
        <div style={{ marginBottom: "10px", fontSize: "14px" }}>
          {statusMsg}
        </div>
      ) : null}

      <Field label="First Name" error={errors.firstName}>
        <input
          className={`signup-input ${errors.firstName ? "error" : ""}`}
          value={form.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
        />
      </Field>

      <Field label="Last Name" error={errors.lastName}>
        <input
          className={`signup-input ${errors.lastName ? "error" : ""}`}
          value={form.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
        />
      </Field>

      <Field label="UIN" error={errors.uin}>
        <input
          className={`signup-input ${errors.uin ? "error" : ""}`}
          value={form.uin}
          onChange={(e) => updateField("uin", e.target.value)}
        />
      </Field>

      <Field label="Email" error={errors.email}>
        <input
          className={`signup-input ${errors.email ? "error" : ""}`}
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </Field>

      <Field label="Password" error={errors.password}>
        <input
          type="password"
          className={`signup-input ${errors.password ? "error" : ""}`}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
        />
      </Field>

      <Field label="Confirm Password" error={errors.confirmPassword}>
        <input
          type="password"
          className={`signup-input ${errors.confirmPassword ? "error" : ""}`}
          value={form.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
        />
      </Field>

      <button className="signup-btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}