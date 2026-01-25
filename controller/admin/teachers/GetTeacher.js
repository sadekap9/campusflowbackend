const db = require("../../../config/db");

/* =========================
   GET SINGLE TEACHER
========================= */
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
        CASE 
          WHEN gender = 1 THEN 'Male'
          WHEN gender = 2 THEN 'Female'
          WHEN gender = 3 THEN 'Other'
          ELSE 'Unknown'
        END AS gender,
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
