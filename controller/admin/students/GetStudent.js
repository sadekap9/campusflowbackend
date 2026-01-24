const db = require("../../../config/db");

exports.GetStudent = async (req, res) => {
  try {
    const { student_id } = req.params;

    const [rows] = await db.query(
      `SELECT
        student_id,
        enrollment_no,
        full_name,
        mother_name,
        father_name,
        blood_group,
        class_id,
        section_id,
        admission_date,
        date_of_birth,
        gender,
        address,
        city,
        state,
        pincode,
        guardian_name,
        guardian_phone,
        status,
        profile_image
      FROM student_profile
      WHERE student_id = ?`,
      [student_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      student: rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
