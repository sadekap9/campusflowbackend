const db = require("../../config/db");
exports.UpdateTimetable = async (req, res) => {
  const { timetable_id } = req.params;
  const { subject_id, teacher_id, academic_year } = req.body;

  const [result] = await db.query(
    `UPDATE timetable SET
      subject_id = COALESCE(?, subject_id),
      teacher_id = COALESCE(?, teacher_id),
      academic_year = COALESCE(?, academic_year),
      proxy_teacher_id = NULL,
      proxy_date = NULL
     WHERE timetable_id = ?`,
    [subject_id, teacher_id, academic_year, timetable_id]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: "Timetable not found" });
  }

  res.json({ message: "Timetable updated successfully" });
};
