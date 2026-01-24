const db = require("../../config/db");

/* =========================
   ADD TIMETABLE ENTRY
========================= */
exports.AddTimetable = async (req, res) => {
    console.log("api hit");
    
  try {
    const {
      class_id,
      section_id,
      day_of_week,
      period_id,
      subject_id,
      teacher_id,
      room_no,
      academic_year
    } = req.body;
 console.log(req.body)
    // ---------------- VALIDATION ----------------
    if (
      !class_id ||
      !section_id ||
      !day_of_week ||
      !period_id ||
      !subject_id ||
      !teacher_id ||
      !academic_year
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    // ---------------- MASTER CHECKS ----------------

    // Check class
    const [[classRow]] = await db.query(
      "SELECT class_id FROM classes WHERE class_id = ?",
      [class_id]
    );
    if (!classRow) {
      return res.status(400).json({ message: "Invalid class selected" });
    }

    // Check section
    const [[sectionRow]] = await db.query(
      "SELECT section_id FROM sections WHERE section_id = ?",
      [section_id]
    );
    if (!sectionRow) {
      return res.status(400).json({ message: "Invalid section selected" });
    }

    // Check period & ensure NOT break
    const [[periodRow]] = await db.query(
      "SELECT period_id, is_break FROM periods WHERE period_id = ?",
      [period_id]
    );
    if (!periodRow) {
      return res.status(400).json({ message: "Invalid period selected" });
    }
    if (periodRow.is_break === 1) {
      return res.status(400).json({
        message: "Cannot assign timetable during break period"
      });
    }

    // Check subject
    const [[subjectRow]] = await db.query(
      "SELECT subject_id FROM subjects WHERE subject_id = ?",
      [subject_id]
    );
    if (!subjectRow) {
      return res.status(400).json({ message: "Invalid subject selected" });
    }

    // Check teacher
    const [[teacherRow]] = await db.query(
      "SELECT teacher_id FROM teachers WHERE teacher_id = ? AND status = 1",
      [teacher_id]
    );
    if (!teacherRow) {
      return res.status(400).json({ message: "Invalid or inactive teacher" });
    }

    // ---------------- DUPLICATE SLOT CHECK ----------------
    const [[slot]] = await db.query(
      `SELECT timetable_id FROM timetable
       WHERE class_id = ?
       AND section_id = ?
       AND day_of_week = ?
       AND period_id = ?`,
      [class_id, section_id, day_of_week, period_id]
    );

    if (slot) {
      return res.status(409).json({
        success: false,
        message: "Timetable slot already exists for this class & period"
      });
    }

    // ---------------- TEACHER CLASH CHECK ----------------
    const [[teacherClash]] = await db.query(
      `SELECT timetable_id FROM timetable
       WHERE teacher_id = ?
       AND day_of_week = ?
       AND period_id = ?`,
      [teacher_id, day_of_week, period_id]
    );

    if (teacherClash) {
      return res.status(409).json({
        success: false,
        message: "Teacher already assigned in another class for this period"
      });
    }

    // ---------------- INSERT ----------------
    await db.query(
      `INSERT INTO timetable
      (class_id, section_id, day_of_week, period_id, subject_id, teacher_id, room_no, academic_year, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        class_id,
        section_id,
        day_of_week,
        period_id,
        subject_id,
        teacher_id,
        room_no || null,
        academic_year
      ]
    );

    res.status(201).json({
      success: true,
      message: "Timetable entry added successfully"
    });

  } catch (error) {
    console.error("AddTimetable error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   GET TIMETABLE (CLASS + SECTION)
========================= */
exports.GetTimetable = async (req, res) => {
  try {
    const { class_id, section_id } = req.query;

    if (!class_id || !section_id) {
      return res.status(400).json({
        success: false,
        message: "class_id and section_id are required"
      });
    }

    const [rows] = await db.query(
      `SELECT
        t.timetable_id,
        t.day_of_week,
        p.period_name,
        p.start_time,
        p.end_time,
        s.subject_name,
        te.name AS teacher_name,
        t.room_no
      FROM timetable t
      JOIN periods p ON p.period_id = t.period_id
      JOIN subjects s ON s.subject_id = t.subject_id
      JOIN teachers te ON te.teacher_id = t.teacher_id
      WHERE t.class_id = ?
      AND t.section_id = ?
      AND t.status = 'active'
      ORDER BY t.day_of_week, p.period_number`,
      [class_id, section_id]
    );

    res.status(200).json({
      success: true,
      timetable: rows
    });

  } catch (error) {
    console.error("GetTimetable error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   DELETE TIMETABLE ENTRY
========================= */
exports.DeleteTimetable = async (req, res) => {
  try {
    console.log("api hit")
    const { timetable_id } = req.params;

    const [[exists]] = await db.query(
      "SELECT timetable_id FROM timetable WHERE timetable_id = ?",
      [timetable_id]
    );

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: "Timetable entry not found"
      });
    }

    await db.query(
      "DELETE FROM timetable WHERE timetable_id = ?",
      [timetable_id]
    );

    res.status(200).json({
      success: true,
      message: "Timetable entry deleted successfully"
    });

  } catch (error) {
    console.error("DeleteTimetable error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
