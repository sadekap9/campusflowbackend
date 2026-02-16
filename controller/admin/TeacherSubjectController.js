const db = require("../../config/db");

/* =========================
   ASSIGN / UPDATE SUBJECT TO TEACHER
========================= */
exports.AssignSubjectToTeacher = async (req, res) => {
  try {
    const {
      teacher_id,
      class_id,
      subject_id
    } = req.body;

    // 🔐 TEMP: until auth middleware is wired
    const created_by = req.user?.admin_id || 1; 
    // ↑ replace `1` with real admin id later

    /* =========================
       1️⃣ Validation
    ========================= */
    if (!teacher_id || !class_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message:
          "teacher_id, class_id and subject_id are required"
      });
    }

    /* =========================
       2️⃣ Check existing ACTIVE assignment
    ========================= */
    const [existing] = await db.query(
      `SELECT teacher_subject_id, teacher_id
       FROM teacher_subject
       WHERE class_id = ?
       AND subject_id = ?`,
      [class_id,subject_id]
    );

    /* =========================
       3️⃣ Same teacher already assigned
    ========================= */
    if (existing.length > 0 && existing[0].teacher_id == teacher_id) {
      return res.status(200).json({
        success: true,
        message: "Teacher already assigned to this subject"
      });
    }

    /* =========================
       4️⃣ Delete previous assignment
    ========================= */
    if (existing.length > 0) {
      await db.query(
        `DELETE FROM teacher_subject
         WHERE teacher_subject_id = ?`,
        [existing[0].teacher_subject_id]
      );
    }

    /* =========================
       5️⃣ Insert new assignment (FIXED)
    ========================= */
    await db.query(
      `INSERT INTO teacher_subject
       (teacher_id, class_id, subject_id)
       VALUES (?, ?, ?)`,
      [teacher_id, class_id, subject_id]
    );

    return res.status(201).json({
      success: true,
      message: "Subject assigned to teacher successfully"
    });

  } catch (error) {
    console.error("AssignSubjectToTeacher error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
/* =========================
   GET ALL ASSIGNED SUBJECTS
========================= */
exports.GetAssignedSubjects = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        ts.teacher_subject_id,
        ts.teacher_id,
        t.name AS teacher_name,
        ts.class_id,
        c.class_name,
        ts.subject_id,
        s.subject_name,
        ts.created_at
       FROM teacher_subject ts
       LEFT JOIN teachers t ON ts.teacher_id = t.teacher_id
       LEFT JOIN classes c ON ts.class_id = c.class_id
       LEFT JOIN subjects s ON ts.subject_id = s.subject_id
       ORDER BY ts.created_at DESC`
    );

    return res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error("GetAssignedSubjects error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


exports.GetAssignedTeachersByClass = async (req, res) => {
  try {
    const { class_id } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        ts.teacher_subject_id,
        ts.teacher_id,
        ts.class_id,
        ts.subject_id,
        ts.created_at,
        t.name AS teacher_name,
        t.status,
        IF(t.status = 0, 'Teacher is inactive', 'OK') AS message
      FROM teacher_subject ts
     
      JOIN teachers t ON ts.teacher_id = t.teacher_id
      WHERE ts.class_id = ? 
      AND t.status = '1' 
      `,
      [class_id]
    );

    res.json({
      success: true,
      total: rows.length,
      assignments: rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   UPDATE ASSIGNED SUBJECT
========================= */
exports.UpdateAssignedSubject = async (req, res) => {
  try {
    const { teacher_subject_id } = req.params;
    const { teacher_id, class_id, subject_id } = req.body;

    if (!teacher_subject_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_subject_id is required"
      });
    }

    // Check if the assignment exists
    const [existing] = await db.query(
      "SELECT * FROM teacher_subject WHERE teacher_subject_id = ?",
      [teacher_subject_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    // Update query
    await db.query(
      `UPDATE teacher_subject 
       SET teacher_id = ?,
           class_id = ?,
           subject_id = ?
       WHERE teacher_subject_id = ?`,
      [teacher_id, class_id, subject_id, teacher_subject_id]
    );

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully"
    });
  } catch (error) {
    console.error("UpdateAssignedSubject error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   DELETE ASSIGNED SUBJECT
========================= */
exports.DeleteAssignedSubject = async (req, res) => {
  try {
    const { teacher_subject_id } = req.params;

    if (!teacher_subject_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_subject_id is required"
      });
    }

    const [existing] = await db.query(
      "SELECT * FROM teacher_subject WHERE teacher_subject_id = ?",
      [teacher_subject_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    await db.query(
      "DELETE FROM teacher_subject WHERE teacher_subject_id = ?",
      [teacher_subject_id]
    );

    return res.status(200).json({
      success: true,
      message: "Assignment removed successfully"
    });
  } catch (error) {
    console.error("DeleteAssignedSubject error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
