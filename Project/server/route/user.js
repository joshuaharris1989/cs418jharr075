import { Router } from "express";
import { connection } from "../database/connection.js";
import { sendEmail } from '../helper/sendmail.js';
import { comparePassword, hashPassword } from "../helper/util.js";
import.meta.env.VITE_API_URL
const user = Router();


// =======================
// EMAIL VERIFICATION (added)
// GET /user/verify-email?email=...&token=...
// =======================
user.get("/verify-email", async (req, res) => {
    try {
        const { email, token } = req.query;

        if (!email || !token) {
            return res.status(400).send("Missing email or token");
        }

        const [rows] = await connection.execute(
            "SELECT token, expires_at FROM email_verify_token WHERE email = ? LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            return res.status(400).send("Invalid verification request");
        }

        const record = rows[0];

        if (record.token !== token) {
            return res.status(400).send("Invalid token");
        }

        if (Date.now() > new Date(record.expires_at).getTime()) {
            return res.status(400).send("Token expired");
        }

        await connection.execute(
            "UPDATE user_info SET u_is_verified = 1 WHERE u_email = ?",
            [email]
        );

        await connection.execute(
            "DELETE FROM email_verify_token WHERE email = ?",
            [email]
        );

        return res.send("Email verified successfully! You can now log in.");
    } catch (err) {
        return res.status(500).send(err.message);
    }
});

// =======================
// GET ALL USERS
// =======================
user.get("/", async (req, res) => {
    try {
        const [rows] = await connection.execute("SELECT * FROM user_info");

        res.status(200).json({
            status: 200,
            message: "Users fetched successfully",
            data: rows
        });

    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});

// =======================
// GET USER BY ID
// =======================
user.get("/:id", async (req, res) => {
    try {
        const [rows] = await connection.execute(
            "SELECT * FROM user_info WHERE u_id = ?",
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "User not found",
                data: null
            });
        }
        res.status(200).json({
            status: 200,
            message: "User fetched successfully",
            data: rows[0]
        });

    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});


// =======================
// CREATE USER
// =======================
// =======================
// CREATE USER
// =======================
user.post("/", async (req, res) => {
    try {
        const {
            u_first_name,
            u_last_name,
            u_email,
            u_password,
            u_is_verified,
            u_is_admin
        } = req.body;

        if (!u_first_name || !u_last_name || !u_email || !u_password) {
            return res.status(400).json({
                status: 400,
                message: "Missing required fields",
                data: null
            });
        }

        // Check if email already exists
        const [existing] = await connection.execute(
            "SELECT u_id FROM user_info WHERE u_email = ? LIMIT 1",
            [u_email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                status: 409,
                message: "Email already registered",
                data: null
            });
        }

        const hashedPassword = hashPassword(u_password);

        const [result] = await connection.execute(
            `INSERT INTO user_info 
            (u_first_name, u_last_name, u_email, u_password, u_is_verified, u_is_admin)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                u_first_name,
                u_last_name,
                u_email,
                hashedPassword,
                u_is_verified ?? 0,
                u_is_admin ?? 0
            ]
        );

        // simple email verification token (lecture style)
        const token = Math.random().toString(36).slice(2);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await connection.execute(
            `
            INSERT INTO email_verify_token (email, token, expires_at)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
              token = VALUES(token),
              expires_at = VALUES(expires_at)
            `,
            [u_email, token, expiresAt]
        );

        const verifyLink =
            `${process.env.BE_ORIGIN}/user/verify-email?email=${encodeURIComponent(u_email)}&token=${token}`;

        console.log("VERIFY LINK:", verifyLink);

        sendEmail(
            u_email,
            "Verify your email",
            `<a href="${verifyLink}">Click here to verify</a>`
        );

        res.status(201).json({
            status: 201,
            message: "User created successfully",
            data: { insertId: result.insertId }
        });

    } catch (err) {
        console.log("CREATE USER ERROR:", err);

        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});

// =======================
// UPDATE USER
// =======================
user.put("/:id", async (req, res) => {
    try {
        const { u_first_name, u_last_name } = req.body;

        if (!u_first_name || !u_last_name) {
            return res.status(400).json({
                status: 400,
                message: "Missing required fields",
                data: null
            });
        }

        const [result] = await connection.execute(
            "UPDATE user_info SET u_first_name = ?, u_last_name = ? WHERE u_id = ?",
            [u_first_name, u_last_name, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 404,
                message: "User not found",
                data: null
            });
        }

        res.status(200).json({
            status: 200,
            message: "User updated successfully",
            data: { affectedRows: result.affectedRows }
        });

    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});


// =======================
// DELETE USER
// =======================
user.delete("/:id", async (req, res) => {
    try {
        const [result] = await connection.execute(
            "DELETE FROM user_info WHERE u_id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: 404,
                message: "User not found",
                data: null
            });
        }

        res.status(200).json({
            status: 200,
            message: "User deleted successfully",
            data: { affectedRows: result.affectedRows }
        });

    } catch (err) {
        res.status(500).json({
            status: 500,
            message: err.message,
            data: null
        });
    }
});


//========================
//Login API
//========================
user.post("/login", async (req, res) => {
    try {
        // Debug (optional)
        // console.log("headers content-type:", req.headers["content-type"]);
        // console.log("body:", req.body);

        const { u_email, u_password } = req.body || {};

        // 1) Validate input
        if (!u_email || !u_password) {
            return res.status(400).json({
                status: 400,
                message: "Email and password are required",
                data: null,
            });
        }

        // 2) Query user by email
        const [rows] = await connection.execute(
            // "SELECT * FROM user_info WHERE u_email = ? and u_password=? LIMIT 1",
            "SELECT * FROM user_info WHERE u_email = ? LIMIT 1", //changes after hashed password explanation
            // [u_email, u_password] 
            [u_email] //changes after hashed password explanation
        );

        if (rows.length === 0) {
            return res.status(401).json({
                status: 401,
                message: "Invalid email or password",
                data: null,
            });
        }

        const userRecord = rows[0];

        if (!userRecord.u_is_verified) {
            return res.status(403).json({
                status: 403,
                message: "Please verify your email before logging in.",
                data: null,
            });
        }

        // 3) Password check (PLAIN TEXT version - for class demo only)
        // if (userRecord.u_password !== u_password) {
        if (!comparePassword(u_password, userRecord.u_password)) {  //changes after hashed password explanation
            return res.status(401).json({
                status: 401,
                message: "Invalid email or password",
                data: null,
            });
        }

        // 4) Remove password before sending back
        const { u_password: _, ...safeUser } = userRecord;
        // const { u_password:_, u_is_admin,u_is_verified, ...safeUser } = userRecord;

        // 5) Generate OTP and store in DB (5 min expiry)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        console.log("OTP:", otp);

        await connection.execute(
            `
            INSERT INTO email_otp (email, otp, expires_at)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
              otp = VALUES(otp),
              expires_at = VALUES(expires_at)
            `,
            [u_email, otp, expiresAt]
        );

        // 6) Send OTP via email
        const subject = "Your Login OTP";
        const body = `
      <h2>Login Verification</h2>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:2px;">${otp}</h1>
      <p>This OTP will expire in 5 minutes.</p>
    `;

        sendEmail(u_email, subject, body);

        return res.status(200).json({
            status: 200,
            // message: "Login successful",
            message: "OTP sent to your email.", // changes after 2FA
            email: u_email
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            message: err.message,
            data: null,
        });
    }
});


//======================== 
//Verify Login OTP (Step 2: verify -> login complete)
//========================
user.post("/verify-login-otp", async (req, res) => {
    try {
        const { email, otp } = req.body || {};

        if (!email || !otp) {
            return res.status(400).json({
                status: 400,
                message: "Email and OTP are required",
                data: null,
            });
        }

        const [rows] = await connection.execute(
            "SELECT otp, expires_at FROM email_otp WHERE email = ? LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            return res.status(400).json({
                status: 400,
                message: "OTP not found. Please request again.",
                data: null,
            });
        }

        const record = rows[0];
        const expiresAt = new Date(record.expires_at);

        if (Date.now() > expiresAt.getTime()) {
            await connection.execute("DELETE FROM email_otp WHERE email = ?", [email]);
            return res.status(400).json({
                status: 400,
                message: "OTP expired. Please request again.",
                data: null,
            });
        }

        if (record.otp !== otp) {
            return res.status(400).json({
                status: 400,
                message: "Invalid OTP.",
                data: null,
            });
        }

        await connection.execute("DELETE FROM email_otp WHERE email = ?", [email]);

        const [userRows] = await connection.execute(
            "SELECT * FROM user_info WHERE u_email = ? LIMIT 1",
            [email]
        );

        const userRecord = userRows[0];
        const { u_password: _, ...safeUser } = userRecord;

        return res.status(200).json({
            status: 200,
            message: "OTP verified. Login complete.",
            data: safeUser,
        });
    } catch (err) {
        return res.status(500).json({
            status: 500,
            message: err.message,
            data: null,
        });
    }
});
export default user;