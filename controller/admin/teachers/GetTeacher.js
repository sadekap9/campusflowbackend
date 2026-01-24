const db = require("../../../config/db");

exports.GetTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    const [rows] = await db.query(
      `SELECT
        teacher_id,
        emp_id,
        name,
        email,
        phone,
        gender,
        qualification,
        experience_year,
        address,
        joining_date,
        status,
        profile_image
      FROM teachers
      WHERE teacher_id = ?`,
      [teacher_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    res.status(200).json({
      success: true,
      teacher: rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
