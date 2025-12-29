// controllers/admin/classSectionOverviewController.js
const db = require("../../../config/db");

exports.GetClass = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        c.class_id,
        c.class_name,
        s.section_id,
        s.section_name,
        t.name AS teacher_name,
        COUNT(st.student_id) AS student_count
      FROM sections s
      JOIN classes c ON c.class_id = s.class_id
      LEFT JOIN teachers t ON t.teacher_id = s.teacher_id
      LEFT JOIN student_profile st 
        ON st.class_id = s.class_id 
       AND st.section_id = s.section_id
      GROUP BY
        s.section_id,
        c.class_name,
        s.section_name,
        t.name
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
