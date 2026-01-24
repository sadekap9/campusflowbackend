const db = require("../../config/db");

/* =========================
   ASSIGN / UPDATE SUBJECT TO TEACHER
========================= */
exports.AssignSubjectToTeacher = async (req, res) => {
  try {
    const { teacher_id, class_id, subject_id } = req.body;

    if (!teacher_id || !class_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id, class_id and subject_id are required"
      });
    }

    // 1️⃣ Check existing ACTIVE assignment
    const [existing] = await db.query(
      `SELECT id, teacher_id
       FROM teacher_subject
       WHERE class_id = ?
       AND subject_id = ?
       AND status = 'active'`,
      [class_id, subject_id]
    );

    // 2️⃣ If same teacher already assigned → do nothing
    if (existing.length > 0 && existing[0].teacher_id == teacher_id) {
      return res.status(200).json({
        success: true,
        message: "Teacher already assigned to this subject"
      });
    }

    // 3️⃣ Deactivate previous assignment (if exists)
    if (existing.length > 0) {
      await db.query(
        `UPDATE teacher_subject
         SET status = 'inactive'
         WHERE id = ?`,
        [existing[0].id]
      );
    }

    // 4️⃣ Assign new teacher
    await db.query(
      `INSERT INTO teacher_subject
       (teacher_id, class_id, subject_id, status)
       VALUES (?, ?, ?, 'active')`,
      [teacher_id, class_id, subject_id]
    );

    res.status(201).json({
      success: true,
      message: "Subject assigned to teacher successfully"
    });

  } catch (error) {
    console.error("AssignSubjectToTeacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
