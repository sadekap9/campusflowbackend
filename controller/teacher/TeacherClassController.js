const db = require("../../config/db");

/* =========================================================
   1️⃣ GET CLASSES & SECTIONS TEACHER TEACHES
   - Returns unique list of Class + Section where teacher is
     either the Class Teacher or a Subject Teacher.
========================================================= */
exports.GetTeacherClassesAndSections = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required in the URL"
      });
    }

    const [rows] = await db.query(
      `
      SELECT DISTINCT
        c.class_id,
        c.class_name,
        s.section_id,
        s.section_name,
        sub.subject_id,
        sub.subject_name
      FROM sections s
      JOIN classes c ON c.class_id = s.class_id
      JOIN teacher_subject ts 
        ON ts.class_id = s.class_id 
      JOIN subjects sub ON ts.subject_id = sub.subject_id
      WHERE
        ts.teacher_id = ?
        AND ts.status = 'active'
      ORDER BY c.class_name, s.section_name, sub.subject_name;
      `,
      [teacher_id]
    );

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("GetTeacherClassesAndSections Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error: " + error.message
    });
  }
};
