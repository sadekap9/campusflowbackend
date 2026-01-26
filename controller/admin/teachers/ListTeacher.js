const db = require("../../../config/db");

exports.ListTeacher = async (req, res) => {
  try {
    const [teachers] = await db.query(`
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

        -- joined data
        ts.teacher_subject_id,
        ts.class_id,
        c.class_name,
        ts.subject_id,
        s.subject_name,
        ts.status AS subject_status,
        ts.created_at AS subject_assigned_at

      FROM teachers t
      LEFT JOIN teacher_subject ts
        ON ts.teacher_id = t.teacher_id
        AND ts.status = 'active'
      LEFT JOIN classes c ON ts.class_id = c.class_id
      LEFT JOIN subjects s ON ts.subject_id = s.subject_id

      ORDER BY t.teacher_id DESC
    `);

    res.status(200).json({
      success: true,
      total: teachers.length,
      teachers
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
