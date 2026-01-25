const db = require("../../../config/db");

/* =========================
   GET SINGLE STUDENT
========================= */
exports.GetStudent = async (req, res) => {
  try {
    const { student_id } = req.params;

    const [rows] = await db.query(
      `SELECT
        student_id,
        enrollment_no,
        email,
        phone,
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
    console.error("GetStudent error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   UPDATE STUDENT
========================= */
exports.UpdateStudent = async (req, res) => {
  try {
    const { student_id } = req.params;

    const {
      full_name,
      email,
      mobile_number,
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
      status
    } = req.body;

    // Check student exists
    const [existing] = await db.query(
      "SELECT student_id, email FROM student_profile WHERE student_id = ?",
      [student_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Email uniqueness check (if email is being changed)
    if (email && email !== existing[0].email) {
      const [emailCheck] = await db.query(
        "SELECT student_id FROM student_profile WHERE email = ? AND student_id != ?",
        [email, student_id]
      );
      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another student"
        });
      }
    }

    const profile_image = req.file
      ? req.file.path.replace(/\\/g, "/")
      : null;

    await db.query(
      `UPDATE student_profile SET
        full_name = ?,
        email = ?,
        phone = ?,
        mother_name = ?,
        father_name = ?,
        blood_group = ?,
        class_id = ?,
        section_id = ?,
        admission_date = ?,
        date_of_birth = ?,
        address = ?,
        city = ?,
        state = ?,
        pincode = ?,
        guardian_name = ?,
        guardian_phone = ?,
        status = ?,
        profile_image = COALESCE(?, profile_image)
      WHERE student_id = ?`,
      [
        full_name,
        email,
        mobile_number,
        mother_name,
        father_name,
        blood_group,
        class_id,
        section_id,
        admission_date,
        date_of_birth,
        address,
        city,
        state,
        pincode,
        guardian_name,
        guardian_phone,
        status,
        profile_image,
        student_id
      ]
    );

    res.status(200).json({
      success: true,
      message: "Student updated successfully"
    });

  } catch (error) {
    console.error("UpdateStudent error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   DELETE STUDENT
========================= */
exports.DeleteStudent = async (req, res) => {
  try {
    const { student_id } = req.params;

    const [existing] = await db.query(
      "SELECT student_id FROM student_profile WHERE student_id = ?",
      [student_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    await db.query(
      "DELETE FROM student_profile WHERE student_id = ?",
      [student_id]
    );

    res.status(200).json({
      success: true,
      message: "Student deleted successfully"
    });

  } catch (error) {
    console.error("DeleteStudent error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
