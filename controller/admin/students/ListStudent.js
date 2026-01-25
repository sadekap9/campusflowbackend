const db = require("../../../config/db");

exports.ListStudent = async (req, res) => {
  try {
    console.log("ListStudent API hit");

    const [rows] = await db.query(`
      SELECT
        sp.student_id,
        sp.enrollment_no,
        full_name,
        email,
        phone AS mobile_number,
        mother_name,
        father_name,
        blood_group,
        sp.class_id AS class_id,
        c.class_name AS class_name,
        sp.section_id AS section_id,
        s.section_name AS section_name,
        CASE 
          WHEN gender = '1' THEN 'Male'
          WHEN gender = '2' THEN 'Female'
          WHEN gender = '3' THEN 'Other'
          ELSE 'Unknown'
        END AS gender,
        admission_date,
        date_of_birth,
        address,
        city,
        state,
        pincode,
        guardian_name,
        guardian_phone,
        status,
        profile_image
      FROM student_profile sp
      LEFT JOIN classes c 
        ON c.class_id = sp.class_id
      LEFT JOIN sections s 
        ON s.section_id = sp.section_id
      ORDER BY sp.created_at DESC
    `);

    res.status(200).json({
      success: true,
      total: rows.length,
      students: rows
    });

  } catch (error) {
    console.error("ListStudent error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
