const db = require("../../config/db");

const VALID_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];

/* =========================
   ADD TIMETABLE ENTRY
========================= */
exports.AddTimetable = async (req, res) => {
  let conn;
  try {
    conn = await db.getConnection();
    const {
      class_id,
      section_id,
      day_of_week,
      start_time,
      subject_id,
      teacher_id,
      academic_year
    } = req.body;

    /* ---------- Validation ---------- */
    if (
      !class_id ||
      !section_id ||
      !day_of_week ||
      !start_time ||
      !subject_id ||
      !teacher_id ||
      !academic_year
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!VALID_DAYS.includes(day_of_week.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid day_of_week"
      });
    }

    await conn.beginTransaction();

    /* ---------- Slot clash check ---------- */
    const [[slot]] = await conn.query(
      `SELECT timetable_id FROM timetable
       WHERE class_id = ?
       AND section_id = ?
       AND day_of_week = ?
       AND start_time = ?
       AND status = 'active'`,
      [class_id, section_id, day_of_week, start_time]
    );

    if (slot) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: "Timetable slot already exists"
      });
    }

    /* ---------- Teacher clash check ---------- */
    const [[clash]] = await conn.query(
      `SELECT timetable_id FROM timetable
       WHERE teacher_id = ?
       AND day_of_week = ?
       AND start_time = ?
       AND status = 'active'`,
      [teacher_id, day_of_week, start_time]
    );

    if (clash) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: "Teacher already busy"
      });
    }

    /* ---------- Insert timetable ---------- */
    await conn.query(
      `INSERT INTO timetable
       (class_id, section_id, day_of_week, start_time,
        subject_id, teacher_id, academic_year, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        class_id,
        section_id,
        day_of_week.toLowerCase(),
        start_time,
        subject_id,
        teacher_id,
        academic_year
      ]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Timetable added successfully"
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("AddTimetable error details:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message
    });
  } finally {
    if (conn) conn.release();
  }
};

/* =========================
   GET TIMETABLE
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
        t.*,
        s.subject_name,
        te.name AS teacher_name
      FROM timetable t
      JOIN subjects s ON s.subject_id = t.subject_id
      JOIN teachers te ON te.teacher_id = t.teacher_id
      WHERE t.class_id = ?
      AND t.section_id = ?
      AND t.status = 'active'
      ORDER BY
        FIELD(t.day_of_week,
          'monday','tuesday','wednesday','thursday','friday','saturday'),
        t.start_time`,
      [class_id, section_id]
    );

    res.json({
      success: true,
      timetable: rows
    });

  } catch (err) {
    console.error("GetTimetable error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* =========================
   DELETE TIMETABLE
========================= */
exports.DeleteTimetable = async (req, res) => {
  try {
    const { timetable_id } = req.params;

    const [result] = await db.query(
      `UPDATE timetable
       SET status = 'inactive'
       WHERE timetable_id = ?`,
      [timetable_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Timetable entry not found"
      });
    }

    res.json({
      success: true,
      message: "Timetable entry deleted successfully"
    });

  } catch (err) {
    console.error("DeleteTimetable error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
