const db = require("../../../config/db");

exports.ListStudent = async (req, res) => {
  try {
    console.log("api hit");

    const [rows] = await db.query(
      "SELECT * FROM student_profile"
    );

    res.json({
      success: true,
      total: rows.length,
      students: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
