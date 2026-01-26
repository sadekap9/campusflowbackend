const db = require("../../../config/db");

/* =========================
   GET SINGLE TEACHER
========================= */
exports.GetTeacher = async (req, res) => {
  try {
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({
        success: false,
        message: "class_id is required"
      });
    }

    const [rows] = await db.query(
      `SELECT 
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
        s.subject_name,
        ts.teacher_type
      FROM teachers t
      JOIN teacher_subject ts ON t.teacher_id = ts.teacher_id
      JOIN subjects s ON ts.subject_id = s.subject_id
      WHERE ts.class_id = ?`,
      [class_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No teachers found for this class"
      });
    }

    res.status(200).json({
      success: true,
      teachers: rows
    });

  } catch (error) {
    console.error("GetTeacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   UPDATE TEACHER
========================= */
exports.UpdateTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    const {
      name,
      email,
      phone,
      gender,
      qualification,
      experience_year,
      address,
      joining_date,
      status
    } = req.body;

    // Check teacher exists
    const [existing] = await db.query(
      "SELECT teacher_id FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    const profile_image = req.file
      ? req.file.path.replace(/\\/g, "/")
      : null;

    await db.query(
      `UPDATE teachers SET
        name = ?,
        email = ?,
        phone = ?,
        qualification = ?,
        experience_year = ?,
        address = ?,
        joining_date = ?,
        status = ?,
        profile_image = COALESCE(?, profile_image)
      WHERE teacher_id = ?`,
      [
        name,
        email,
        phone,
        qualification,
        experience_year,
        address,
        joining_date,
        status,
        profile_image,
        teacher_id
      ]
    );

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully"
    });

  } catch (error) {
    console.error("UpdateTeacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   DELETE TEACHER
========================= */
exports.DeleteTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    const [existing] = await db.query(
      "SELECT teacher_id FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    await db.query(
      "DELETE FROM teachers WHERE teacher_id = ?",
      [teacher_id]
    );

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully"
    });

  } catch (error) {
    console.error("DeleteTeacher error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
