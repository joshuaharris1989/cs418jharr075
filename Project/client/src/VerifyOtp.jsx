import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css"; // reuse your existing styles

export default function VerifyOtp() {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const navigate = useNavigate();

    // Email stored during login success
    const email = localStorage.getItem("pendingOtpEmail") || "";

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        setError("");

        if (!email) {
            setError("No pending login found. Please login again.");
            return;
        }

        const cleanedOtp = otp.trim();

        // Basic validation (6 digits)
        if (!/^\d{6}$/.test(cleanedOtp)) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(
                import.meta.env.VITE_API_KEY + "/user/verify-login-otp",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email,
                        otp: cleanedOtp,
                    }),
                }
            );

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(json?.message || "OTP verification failed");
                return;
            }

            const user = json?.data ?? null;
            if (!user) {
                setError("OTP verified but user data was missing.");
                return;
            }

            // ✅ Now user is authenticated → store and redirect
            localStorage.setItem("loggedInUser", JSON.stringify(user));
            localStorage.removeItem("pendingOtpEmail");

            navigate("/dashboard");
        } catch (err) {
            setError(err?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const otpNotValid = submitted && !/^\d{6}$/.test(otp.trim());

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

            <form onSubmit={handleVerifyOtp}>
                <div className="controls">
                    <p>
                        <label>Email</label>
                        <input type="email" value={email} disabled />
                    </p>

                    <p>
                        <label className={otpNotValid ? "invalid" : ""}>OTP</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            className={otpNotValid ? "invalid" : ""}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter 6-digit OTP"
                        />
                    </p>
                </div>

                <div className="actions">
                    <Link to="/login" className="button" style={{ textAlign: "center" }}>
                        Back to Login
                    </Link>

                    <button className="button" type="submit" disabled={loading}>
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </div>
            </form>
        </div>
    );
}