const db = require("../../config/db");

/* =========================
   ASSIGN / UPDATE SUBJECT TO TEACHER
========================= */
exports.AssignSubjectToTeacher = async (req, res) => {
  try {
    const {
      teacher_id,
      class_id,
      section_id,
      subject_id
    } = req.body;

    // 🔐 TEMP: until auth middleware is wired
    const created_by = req.user?.admin_id || 1; 
    // ↑ replace `1` with real admin id later

    /* =========================
       1️⃣ Validation
    ========================= */
    if (!teacher_id || !class_id || !section_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message:
          "teacher_id, class_id, section_id and subject_id are required"
      });
    }

    /* =========================
       2️⃣ Check existing ACTIVE assignment
    ========================= */
    const [existing] = await db.query(
      `SELECT id, teacher_id
       FROM teacher_subject
       WHERE class_id = ?
       AND section_id = ?
       AND subject_id = ?
       AND status = 'active'`,
      [class_id, section_id, subject_id]
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
       4️⃣ Deactivate previous assignment
    ========================= */
    if (existing.length > 0) {
      await db.query(
        `UPDATE teacher_subject
         SET status = 'inactive'
         WHERE id = ?`,
        [existing[0].id]
      );
    }

    /* =========================
       5️⃣ Insert new assignment (FIXED)
    ========================= */
    await db.query(
      `INSERT INTO teacher_subject
       (teacher_id, class_id, section_id, subject_id, status, created_by)
       VALUES (?, ?, ?, ?, 'active', ?)`,
      [teacher_id, class_id, section_id, subject_id, created_by]
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
