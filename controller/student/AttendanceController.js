const db = require("../../config/db");

/* =========================================================
   GET STUDENT ATTENDANCE
   - Returns summary (statistics) and detailed logs.
   ========================================================= */
exports.GetMyAttendance = async (req, res) => {
  try {
    const { student_id } = req.params;

    // 1️⃣ Get detailed logs for this student
    const [rows] = await db.query(
      `SELECT 
        attendance_date, 
        status 
      FROM attendance_student 
      WHERE student_id = ? 
      ORDER BY attendance_date DESC`,
      [student_id]
    );

    // 2️⃣ Calculate summary statistics (Case-insensitive check)
    const totalDays = rows.length;
    const presentDays = rows.filter(r => r.status.toLowerCase() === "present").length;
    const absentDays = rows.filter(r => r.status.toLowerCase() === "absent").length;
    const leaves = rows.filter(r => r.status.toLowerCase() === "leave").length;
    
    const attendancePercentage = totalDays > 0 
      ? ((presentDays / totalDays) * 100).toFixed(2) 
      : 0;

    res.status(200).json({
      success: true,
      summary: {
        total_records: totalDays,
        present: presentDays,
        absent: absentDays,
        leave: leaves,
        percentage: attendancePercentage + "%"
      },
      data: rows
    });

  } catch (error) {
    console.error("GetMyAttendance Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
