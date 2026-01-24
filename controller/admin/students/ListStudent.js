const db = require("../../../config/db");

exports.ListStudent = async (req, res) => {
  try {
    console.log("ListStudent API hit");

    const [rows] = await db.query(`
      SELECT
        sp.student_id,
        sp.full_name,
        sp.enrollment_no,
        sp.blood_group,

        -- ✅ Class name instead of class_id
        c.class_name AS class_name,

        -- ✅ Section name instead of section_id
        s.section_name AS section_name,

        -- ✅ Gender text instead of code
        CASE 
          WHEN sp.gender = 1 THEN 'Male'
          WHEN sp.gender = 2 THEN 'Female'
          WHEN sp.gender = 3 THEN 'Other'
          ELSE 'Unknown'
        END AS gender,

        sp.date_of_birth,
        sp.admission_date,
        sp.address,
        sp.city,
        sp.state,
        sp.pincode,
        sp.guardian_name,
        sp.guardian_phone,
        sp.profile_image,
        sp.created_at

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
