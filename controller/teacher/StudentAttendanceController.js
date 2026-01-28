const db = require("../../config/db");

/* =====================================================
   CREATE / MARK STUDENT ATTENDANCE
===================================================== */
exports.markAttendance = async (req, res) => {
  try {
    const { teacher_id } = req.params; 
    const { student_id, class_id, section_id, attendance_date, status } = req.body;

    if (!student_id || !class_id || !section_id || !attendance_date || !status) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    // 1️⃣ SECURITY: Is this specific teacher_id assigned to this class/section?
    const [assignment] = await db.query(
      `SELECT id FROM teacher_subject 
       WHERE teacher_id = ? AND class_id = ? AND section_id = ?`,
      [teacher_id, class_id, section_id]
    );

    if (assignment.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This teacher is not authorized for this class/section."
      });
    }

    // 2️⃣ VERIFY STUDENT
    const [student] = await db.query(
      `SELECT student_id FROM student_profile 
       WHERE student_id = ? AND class_id = ? AND section_id = ?`,
      [student_id, class_id, section_id]
    );

    if (student.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Student not found in this class and section."
      });
    }

    // 3️⃣ MARK ATTENDANCE (Matches your table exactly: no marked_by)
    await db.query(
      `INSERT INTO attendance
        (student_id, class_id, section_id, attendance_date, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [
        student_id,
        class_id,
        section_id,
        attendance_date,
        status
      ]
    );

    res.status(201).json({
      success: true,
      message: "Attendance marked successfully"
    });

  } catch (error) {
    console.error("Mark Student Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   GET STUDENT ATTENDANCE
===================================================== */
exports.getAttendance = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const { student_id, class_id, section_id, date } = req.query;

    // Security check: only allow viewing if assigned
    if (class_id && section_id) {
        const [assignment] = await db.query(
          "SELECT id FROM teacher_subject WHERE teacher_id = ? AND class_id = ? AND section_id = ?",
          [teacher_id, class_id, section_id]
        );
        if (assignment.length === 0) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this class data" });
        }
    }

    let query = `
      SELECT 
        a.attendance_id,
        a.student_id,
        s.full_name as student_name,
        a.class_id,
        a.section_id,
        a.attendance_date,
        a.status
      FROM attendance a
      JOIN student_profile s ON a.student_id = s.student_id
      WHERE 1 = 1
    `;

    const params = [];

    if (student_id) {
      query += " AND a.student_id = ?";
      params.push(student_id);
    }
    if (class_id) {
      query += " AND a.class_id = ?";
      params.push(class_id);
    }
    if (section_id) {
      query += " AND a.section_id = ?";
      params.push(section_id);
    }
    if (date) {
      query += " AND a.attendance_date = ?";
      params.push(date);
    }

    query += " ORDER BY a.attendance_date DESC";

    const [rows] = await db.query(query, params);

    res.status(200).json({
      success: true,
      attendance: rows
    });

  } catch (error) {
    console.error("Get Student Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   UPDATE STUDENT ATTENDANCE
===================================================== */
exports.updateAttendance = async (req, res) => {
  try {
    const { attendance_id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    const [result] = await db.query(
      `UPDATE attendance
       SET status = ?
       WHERE attendance_id = ?`,
      [status, attendance_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully"
    });

  } catch (error) {
    console.error("Update Student Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   DELETE STUDENT ATTENDANCE
===================================================== */
exports.deleteAttendance = async (req, res) => {
  try {
    const { attendance_id } = req.params;

    const [result] = await db.query(
      `DELETE FROM attendance WHERE attendance_id = ?`,
      [attendance_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance deleted successfully"
    });

  } catch (error) {
    console.error("Delete Student Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
