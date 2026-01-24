const db = require("../../../config/db");

exports.ViewTeacherAttendance = async (req, res) => {
  try {
    const { teacher_id, month, year } = req.query;

    let query = `
      SELECT 
        at.attendance_id,
        at.teacher_id,
        t.emp_id,
        t.name AS teacher_name,
        at.attendance_date,
        at.status
      FROM attendance_teacher at
      JOIN teachers t ON t.teacher_id = at.teacher_id
      WHERE 1 = 1
    `;

    const params = [];

    // Optional filters
    if (teacher_id) {
      query += " AND at.teacher_id = ?";
      params.push(teacher_id);
    }

    if (month && year) {
      query += " AND MONTH(at.attendance_date) = ? AND YEAR(at.attendance_date) = ?";
      params.push(month, year);
    }

    query += " ORDER BY at.attendance_date DESC";

    const [rows] = await db.query(query, params);

    res.status(200).json({
      success: true,
      total: rows.length,
      attendance: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
