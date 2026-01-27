const db = require("../../config/db");
/* =========================
   GET TEACHER'S OWN TIMETABLE
   ========================= */
exports.GetTeacherTimetable = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required"
      });
    }

 const [rows] = await db.query(
      `
      SELECT
        tt.timetable_id,
        tt.day_of_week,
        tt.start_time,
        c.class_name,
        s.section_name,
        sub.subject_name
      FROM timetable tt
      JOIN classes c ON tt.class_id = c.class_id
      JOIN sections s ON tt.section_id = s.section_id
      JOIN subjects sub ON tt.subject_id = sub.subject_id
      WHERE tt.teacher_id = ?
      ORDER BY
        FIELD(tt.day_of_week,
          'monday','tuesday','wednesday',
          'thursday','friday','saturday'
        ),
        tt.start_time
      `,
      [teacher_id]
    );
    res.json({
      success: true,
      count: rows.length,
      timetable: rows
    });

  } catch (err) {
    console.error("GetTeacherTimetable error:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message
    });
  }
};

/* =========================
   GET TIMETABLE OF CLASSES WHERE TEACHER IS "CLASS TEACHER"
   ========================= */
exports.GetAssignedClassTimetable = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required"
      });
    }

    // 1. Find sections where this teacher is the assigned class teacher
    const [sections] = await db.query(
      `SELECT s.section_id, s.section_name, c.class_name, c.class_id
       FROM sections s
       JOIN classes c ON s.class_id = c.class_id
       WHERE s.teacher_id = ?`,
      [teacher_id]
    );

    if (sections.length === 0) {
      return res.json({
        success: true,
        message: "Teacher is not assigned as a class teacher to any section",
        data: []
      });
    }

    // 2. For each section, get the full timetable
    const results = [];
    for (const section of sections) {
      const [timetable] = await db.query(
        `SELECT
          t.*,
          sub.subject_name,
          te.name AS teacher_name
        FROM timetable t
        LEFT JOIN subjects sub ON t.subject_id = sub.subject_id
        LEFT JOIN teachers te ON t.teacher_id = te.teacher_id
        WHERE t.class_id = ? AND t.section_id = ? AND t.status = 'active'
        ORDER BY
          FIELD(t.day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday'),
          t.start_time`,
        [section.class_id, section.section_id]
      );

      results.push({
        class_name: section.class_name,
        section_name: section.section_name,
        class_id: section.class_id,
        section_id: section.section_id,
        timetable: timetable
      });
    }

    res.json({
      success: true,
      data: results
    });

  } catch (err) {
    console.error("GetAssignedClassTimetable error:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message
    });
  }
};


