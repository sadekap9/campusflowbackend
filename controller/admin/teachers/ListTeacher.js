const db = require("../../../config/db");

exports.ListTeacher = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        t.teacher_id,
        t.emp_id,
        t.name,
        t.email,
        t.phone,
        CASE 
          WHEN t.gender = 1 THEN 'Male'
          WHEN t.gender = 2 THEN 'Female'
          WHEN t.gender = 3 THEN 'Other'
          ELSE 'Unknown'
        END AS gender,
        t.qualification,
        t.experience_year,
        t.address,
        t.joining_date,
        t.status,
        t.profile_image,
        ts.class_id,
        ts.subject_id,
        c.class_name,
        s.subject_name
      FROM teachers t
      LEFT JOIN teacher_subject ts ON t.teacher_id = ts.teacher_id AND ts.status = 'active'
      LEFT JOIN classes c ON ts.class_id = c.class_id
      LEFT JOIN subjects s ON ts.subject_id = s.subject_id
      ORDER BY t.teacher_id DESC
    `);

    // Grouping results in JS to prevent duplicate teacher records in the UI
    const teacherMap = new Map();
    rows.forEach(row => {
      const teacherId = row.teacher_id;
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          ...row,
          assignments: []
        });
      }
      
      // If there's an assignment in this row, add it to the array
      if (row.class_name && row.subject_name) {
        teacherMap.get(teacherId).assignments.push({
          class_name: row.class_name,
          subject_name: row.subject_name,
          class_id: row.class_id,
          subject_id: row.subject_id
        });
      }
    });

    const teachers = Array.from(teacherMap.values());

    res.status(200).json({
      success: true,
      total: teachers.length,
      teachers
    });

  } catch (error) {
    console.error("ListTeacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
