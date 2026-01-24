const db = require("../../../config/db");

exports.ListTeacher = async (req, res) => {
  try {
    const [teachers] = await db.query(
      `SELECT 
        teacher_id,
        emp_id,
        name,
        email,
        phone,
        status,
        profile_image
      FROM teachers
      ORDER BY teacher_id DESC`
    );

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
