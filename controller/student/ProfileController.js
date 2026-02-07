const db = require("../../config/db");

exports.GetStudentProfile = async (req, res) => {
  try {
    const { student_id } = req.params;

    // 🔒 Security: The authStudent middleware ensures req.student exists
    // and that the student_id in params matches the student_id in the token.
    
    const [rows] = await db.query(
      `SELECT 
        sp.student_id,
        sp.full_name,
        sp.email,
        sp.phone,
        sp.enrollment_no,
        sp.admission_date,
        sp.date_of_birth,
        sp.gender,
        sp.blood_group,
        sp.address,
        sp.city,
        sp.state,
        sp.pincode,
        sp.mother_name,
        sp.father_name,
        sp.guardian_name,
        sp.guardian_phone,
        sp.profile_image,
        sp.status,
        c.class_name,
        s.section_name
      FROM student_profile sp
      LEFT JOIN classes c ON sp.class_id = c.class_id
      LEFT JOIN sections s ON sp.section_id = s.section_id
      WHERE sp.student_id = ?`,
      [student_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    res.status(200).json({
      success: true,
      profile: rows[0]
    });

  } catch (error) {
    console.error("GetStudentProfile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
