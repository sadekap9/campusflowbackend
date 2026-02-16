const db = require("../../config/db");

/* =====================================================
   1️⃣ MARK / UPDATE TEACHER ATTENDANCE (NO DUPLICATES)
===================================================== */
exports.MarkAttendance = async (req, res) => {
  try {
    // 🟠 Teacher cannot add logout time during mark attendance (it should go null)
    const { teacher_id, attendance_date, status, log_in } = req.body;

    if (!teacher_id || !attendance_date || !status) {
      return res.status(400).json({
        success: false,
        message: "teacher_id, attendance_date, and status are required"
      });
    }

    await db.query(
      `INSERT INTO teacher_attendance
       (teacher_id, attendance_date, status, log_in, log_out)
       VALUES (?, ?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         log_in = COALESCE(VALUES(log_in), log_in)`,
      [teacher_id, attendance_date, status, log_in || null]
    );

    res.status(201).json({
      success: true,
      message: "Teacher attendance saved successfully (Logout time set to null)"
    });

  } catch (error) {
    console.error("MarkTeacherAttendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   2️⃣ GET TEACHER ATTENDANCE
===================================================== */
exports.GetAttendance = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const { start_date, end_date } = req.query;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required"
      });
    }

    let query = `
      SELECT 
        attendance_id,
        teacher_id,
        DATE_FORMAT(attendance_date, '%Y-%m-%d') as attendance_date,
        status,
        log_in,
        log_out
      FROM teacher_attendance
      WHERE teacher_id = ?
    `;

    const params = [teacher_id];

    if (start_date && end_date) {
      query += " AND attendance_date BETWEEN ? AND ?";
      params.push(start_date, end_date);
    } else if (start_date) {
      query += " AND attendance_date >= ?";
      params.push(start_date);
    }

    query += " ORDER BY attendance_date DESC";

    const [rows] = await db.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      attendance: rows
    });

  } catch (error) {
    console.error("GetTeacherAttendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   3️⃣ UPDATE TEACHER ATTENDANCE
===================================================== */
exports.UpdateAttendance = async (req, res) => {
  try {
    const { attendance_id } = req.params;
    const { status, log_in, log_out } = req.body;

    if (!attendance_id) {
      return res.status(400).json({
        success: false,
        message: "attendance_id is required"
      });
    }

    const [result] = await db.query(
      `UPDATE teacher_attendance
       SET 
         status = COALESCE(?, status),
         log_in = COALESCE(?, log_in),
         log_out = COALESCE(?, log_out)
       WHERE attendance_id = ?`,
      [status, log_in, log_out, attendance_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.json({
      success: true,
      message: "Teacher attendance updated successfully"
    });

  } catch (error) {
    console.error("UpdateTeacherAttendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   4️⃣ DELETE TEACHER ATTENDANCE
===================================================== */
exports.DeleteAttendance = async (req, res) => {
  try {
    const { attendance_id } = req.params;

    const [result] = await db.query(
      `DELETE FROM teacher_attendance WHERE attendance_id = ?`,
      [attendance_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.json({
      success: true,
      message: "Teacher attendance deleted successfully"
    });

  } catch (error) {
    console.error("DeleteTeacherAttendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
