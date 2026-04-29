import express from "express";
import { connection } from "../database/connection.js";


const router = express.Router();

// student history
router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store",
    });

    const [rows] = await connection.execute(
      `SELECT advising_id, current_term AS term, status, submitted_at
       FROM course_advising
       WHERE user_id = ?
       ORDER BY advising_id DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// get one advising record
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [advisingRows] = await connection.execute(
      "SELECT * FROM course_advising WHERE advising_id = ?",
      [id]
    );

    if (advisingRows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const [itemRows] = await connection.execute(
      "SELECT * FROM course_advising_items WHERE advising_id = ?",
      [id]
    );

    res.json({
      advising: advisingRows[0],
      items: itemRows
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// create advising record
router.post("/", async (req, res) => {
  const { user_id, last_term, last_gpa, current_term, courses } = req.body;

  try {
    const [result] = await connection.execute(
      `INSERT INTO course_advising (user_id, last_term, last_gpa, current_term, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [user_id, last_term, last_gpa, current_term]
    );

    const advisingId = result.insertId;

    for (let i = 0; i < courses.length; i++) {
      await connection.execute(
        `INSERT INTO course_advising_items (advising_id, course_level, course_name)
         VALUES (?, ?, ?)`,
        [advisingId, courses[i].level, courses[i].name]
      );
    }

    res.json({ message: "Advising created" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// update advising record if still pending
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { last_term, last_gpa, current_term, courses } = req.body;

  try {
    const [checkRows] = await connection.execute(
      "SELECT status FROM course_advising WHERE advising_id = ?",
      [id]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    if (checkRows[0].status !== "pending") {
      return res.status(400).json({ error: "This record can no longer be edited" });
    }

    await connection.execute(
      `UPDATE course_advising
       SET last_term = ?, last_gpa = ?, current_term = ?
       WHERE advising_id = ?`,
      [last_term, last_gpa, current_term, id]
    );

    await connection.execute(
      "DELETE FROM course_advising_items WHERE advising_id = ?",
      [id]
    );

    for (let i = 0; i < courses.length; i++) {
      await connection.execute(
        `INSERT INTO course_advising_items (advising_id, course_level, course_name)
         VALUES (?, ?, ?)`,
        [id, courses[i].level, courses[i].name]
      );
    }

    res.json({ message: "Record updated" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// completed courses for last-term restriction
router.get("/completed/:userId/:term", async (req, res) => {
  const { userId, term } = req.params;

  try {
    const [rows] = await connection.execute(
      "SELECT course_name FROM completed_courses WHERE user_id = ? AND term = ?",
      [userId, term]
    );

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// admin: get all advising records
router.get("/admin/all/list", async (req, res) => {
  try {
    const [rows] = await connection.execute(
      `SELECT
         c.advising_id,
         c.current_term,
         c.status,
         c.submitted_at,
         u.u_first_name,
         u.u_last_name,
         u.u_email
       FROM course_advising c
       JOIN user_info u ON c.user_id = u.u_id
       ORDER BY c.submitted_at DESC`
    );

    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

// admin: approve or reject
  router.put("/admin/status/:id", async (req, res) => {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (!feedback || feedback.trim() === "") {
      return res.status(400).json({ error: "Feedback message is required" });
    }

    try {
      await connection.execute(
        "UPDATE course_advising SET status = ?, feedback = ? WHERE advising_id = ?",
        [status, feedback, id]
      );

      res.json({ message: "Status and feedback updated" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Server error" });
    }
  });

export default router;