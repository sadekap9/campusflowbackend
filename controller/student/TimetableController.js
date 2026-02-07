const db = require("../../config/db");

/* =========================================================
   GET STUDENT'S OWN CLASS TIMETABLE
   ========================================================= */
exports.GetStudentTimetable = async (req, res) => {
  try {
    const { student_id } = req.params;

    // 1️⃣ Get student's class and section information
    const [studentRows] = await db.query(
      "SELECT class_id, section_id FROM student_profile WHERE student_id = ?",
      [student_id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const { class_id, section_id } = studentRows[0];

    // 2️⃣ Fetch the timetable for that class and section
    const [rows] = await db.query(
      `
      SELECT
        tt.timetable_id,
        tt.day_of_week,
        tt.start_time,
        sub.subject_name,
        te.name AS teacher_name
      FROM timetable tt
      LEFT JOIN subjects sub ON tt.subject_id = sub.subject_id
      LEFT JOIN teachers te ON tt.teacher_id = te.teacher_id
      WHERE tt.class_id = ? AND tt.section_id = ? AND tt.status = 'active'
      ORDER BY
        FIELD(tt.day_of_week,
          'monday','tuesday','wednesday',
          'thursday','friday','saturday'
        ),
        tt.start_time
      `,
      [class_id, section_id]
    );

    res.status(200).json({
      success: true,
      count: rows.length,
      timetable: rows
    });

  } catch (error) {
    console.error("GetStudentTimetable Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
