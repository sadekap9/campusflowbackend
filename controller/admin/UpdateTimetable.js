const db = require("../../config/db");
exports.UpdateTimetable = async (req, res) => {
  try {
    const { timetable_id } = req.params;
    const { subject_id, teacher_id, academic_year } = req.body;

    if (!subject_id || !teacher_id || !academic_year) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 1. Get the current slot details (day and time) for this timetable entry
    const [[currentSlot]] = await db.query(
      "SELECT day_of_week, start_time FROM timetable WHERE timetable_id = ?",
      [timetable_id]
    );

    if (!currentSlot) {
      return res.status(404).json({ success: false, message: "Timetable entry not found" });
    }

    const { day_of_week, start_time } = currentSlot;

    // 2. Check if the new teacher is already busy in this slot in ANY OTHER entry
    const [[clash]] = await db.query(
      `SELECT timetable_id FROM timetable 
       WHERE teacher_id = ? 
       AND day_of_week = ? 
       AND start_time = ? 
       AND status = 'active'
       AND timetable_id != ?`,
      [teacher_id, day_of_week, start_time, timetable_id]
    );

    if (clash) {
      return res.status(409).json({
        success: false,
        message: `Conflict detected: This teacher already has a class on ${day_of_week} at ${start_time}`
      });
    }

    // 3. Perform the update
    const [result] = await db.query(
      `UPDATE timetable SET
        subject_id = ?,
        teacher_id = ?,
        academic_year = ?,
        proxy_teacher_id = NULL,
        proxy_date = NULL
       WHERE timetable_id = ?`,
      [subject_id, teacher_id, academic_year, timetable_id]
    );

    res.json({ success: true, message: "Timetable updated successfully" });
  } catch (error) {
    console.error("UpdateTimetable Error:", error);
    res.status(500).json({ success: false, message: "Server error during timetable update" });
  }
};
