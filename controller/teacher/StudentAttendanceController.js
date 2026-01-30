const db = require("../../config/db");

/* =====================================================
   1️⃣ BULK MARK STUDENT ATTENDANCE (NO DUPLICATES EVER)
===================================================== */
exports.markAttendance = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { teacher_id } = req.params;
    const { class_id, section_id, attendance_date, students } = req.body || {};

    if (!class_id || !section_id || !attendance_date || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: "Invalid input"
      });
    }

    // 🔐 SECURITY: Check teacher assignment
    const [assignment] = await connection.query(
      `SELECT teacher_id FROM sections 
       WHERE class_id = ? AND section_id = ?`,
      [class_id, section_id]
    );

    if (!assignment.length || assignment[0].teacher_id != teacher_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    await connection.beginTransaction();

    for (const { student_id, status } of students) {
      if (!student_id || !status) continue;

      // 🔥 SAFE INSERT (DB HANDLES DUPLICATES)
      await connection.query(
        `INSERT INTO attendance_student
         (student_id, class_id, section_id, attendance_date, status)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           class_id = VALUES(class_id),
           section_id = VALUES(section_id)`,
        [student_id, class_id, section_id, attendance_date, status]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "dupicates entry retry again"
    });

  } catch (error) {
    await connection.rollback();
    console.error("Mark Bulk Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    connection.release();
  }
};

/* =====================================================
   2️⃣ GET STUDENT ATTENDANCE
===================================================== */
exports.getAttendance = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    const { class_id, section_id, date, student_id } = req.query;

    let query = `
      SELECT 
        a.attendance_id,
        a.student_id,
        sp.full_name AS student_name,
        a.class_id,
        a.section_id,
        a.attendance_date,
        a.status,
        a.created_at
      FROM attendance_student a
      JOIN student_profile sp ON a.student_id = sp.student_id
      JOIN sections sec 
        ON a.class_id = sec.class_id 
       AND a.section_id = sec.section_id
      WHERE sec.teacher_id = ?
    `;

    const params = [teacher_id];

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
    if (student_id) {
      query += " AND a.student_id = ?";
      params.push(student_id);
    }

    query += " ORDER BY a.attendance_date DESC";

    const [rows] = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: rows.length,
      attendance: rows
    });

  } catch (error) {
    console.error("Get Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   3️⃣ UPDATE STUDENT ATTENDANCE
===================================================== */
exports.updateAttendance = async (req, res) => {
  try {
    const { teacher_id, attendance_id } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // 🔐 SECURITY CHECK
    const [record] = await db.query(
      `SELECT 1
       FROM attendance_student a
       JOIN sections sec 
         ON a.class_id = sec.class_id 
        AND a.section_id = sec.section_id
       WHERE a.attendance_id = ? 
         AND sec.teacher_id = ?`,
      [attendance_id, teacher_id]
    );

    if (!record.length) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    await db.query(
      `UPDATE attendance_student
       SET status = ?
       WHERE attendance_id = ?`,
      [status, attendance_id]
    );

    res.json({
      success: true,
      message: "Attendance updated successfully"
    });

  } catch (error) {
    console.error("Update Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   4️⃣ DELETE STUDENT ATTENDANCE
===================================================== */
exports.deleteAttendance = async (req, res) => {
  try {
    const { teacher_id, attendance_id } = req.params;

    // 🔐 SECURITY CHECK
    const [record] = await db.query(
      `SELECT 1
       FROM attendance_student a
       JOIN sections sec 
         ON a.class_id = sec.class_id 
        AND a.section_id = sec.section_id
       WHERE a.attendance_id = ? 
         AND sec.teacher_id = ?`,
      [attendance_id, teacher_id]
    );

    if (!record.length) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    await db.query(
      `DELETE FROM attendance_student WHERE attendance_id = ?`,
      [attendance_id]
    );

    res.json({
      success: true,
      message: "Attendance deleted successfully"
    });

  } catch (error) {
    console.error("Delete Attendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
