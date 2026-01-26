const db = require("../../config/db");

/* =========================
   MARK TEACHER ATTENDANCE (POST)
   ========================= */
exports.MarkAttendance = async (req, res) => {
  try {
    const { teacher_id, attendance_date, status } = req.body;

    if (!teacher_id || !attendance_date || !status) {
      return res.status(400).json({
        success: false,
        message: "teacher_id, attendance_date, and status are required",
      });
    }

    // Check if attendance already marked for this teacher on this date
    const [existing] = await db.query(
      "SELECT attendance_id FROM teacher_attendance WHERE teacher_id = ? AND attendance_date = ?",
      [teacher_id, attendance_date]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for this teacher on this date",
      });
    }

    const [result] = await db.query(
      "INSERT INTO teacher_attendance (teacher_id, attendance_date, status) VALUES (?, ?, ?)",
      [teacher_id, attendance_date, status]
    );

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      attendance_id: result.insertId,
    });
  } catch (error) {
    console.error("MarkAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   GET TEACHER ATTENDANCE (GET)
   ========================= */
exports.GetAttendance = async (req, res) => {
  try {
    const { teacher_id, start_date, end_date } = req.query;

    let query = "SELECT * FROM teacher_attendance WHERE 1=1";
    const params = [];

    if (teacher_id) {
      query += " AND teacher_id = ?";
      params.push(teacher_id);
    }

    if (start_date && end_date) {
      query += " AND attendance_date BETWEEN ? AND ?";
      params.push(start_date, end_date);
    } else if (start_date) {
      query += " AND attendance_date >= ?";
      params.push(start_date);
    }

    query += " ORDER BY attendance_date DESC";

    const [rows] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      count: rows.length,
      attendance: rows,
    });
  } catch (error) {
    console.error("GetAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   UPDATE TEACHER ATTENDANCE (PATCH)
   ========================= */
exports.UpdateAttendance = async (req, res) => {
  try {
    const { attendance_id } = req.params;
    const { status, attendance_date } = req.body;

    if (!attendance_id) {
      return res.status(400).json({
        success: false,
        message: "attendance_id is required",
      });
    }

    const [result] = await db.query(
      "UPDATE teacher_attendance SET status = COALESCE(?, status), attendance_date = COALESCE(?, attendance_date) WHERE attendance_id = ?",
      [status, attendance_date, attendance_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
    });
  } catch (error) {
    console.error("UpdateAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =========================
   DELETE TEACHER ATTENDANCE (DELETE)
   ========================= */
exports.DeleteAttendance = async (req, res) => {
  try {
    const { attendance_id } = req.params;

    if (!attendance_id) {
      return res.status(400).json({
        success: false,
        message: "attendance_id is required",
      });
    }

    const [result] = await db.query(
      "DELETE FROM teacher_attendance WHERE attendance_id = ?",
      [attendance_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    console.error("DeleteAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
