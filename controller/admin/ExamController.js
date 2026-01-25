const db = require("../../config/db");

/* =========================
   AUTO STATUS UPDATE (SYSTEM)
========================= */
const autoUpdateExamStatus = async () => {
  await db.query(`
    UPDATE exams
    SET status = 'ongoing'
    WHERE status = 'scheduled'
    AND CURDATE() BETWEEN start_date AND end_date
  `);

  await db.query(`
    UPDATE exams
    SET status = 'completed'
    WHERE status = 'ongoing'
    AND CURDATE() > end_date
  `);
};

/* =========================
   CREATE EXAM
========================= */
exports.CreateExam = async (req, res) => {
  try {
    const {
      exam_type,
      academic_year,
      class_id,
      section_id,
      start_date,
      end_date
    } = req.body;

    if (!exam_type || !academic_year || !class_id || !start_date) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }

    const [result] = await db.query(
      `INSERT INTO exams
       (exam_type, academic_year, class_id, section_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
      [exam_type, academic_year, class_id, section_id || null, start_date, end_date]
    );

    return res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam_id: result.insertId
    });

  } catch (error) {
    console.error("CreateExam error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   UPDATE EXAM (DATE / ANYTHING)
========================= */
exports.UpdateExam = async (req, res) => {
  try {
    const { exam_id } = req.params;
    const {
      exam_type,
      academic_year,
      class_id,
      section_id,
      start_date,
      end_date
    } = req.body;

    if (!exam_id) {
      return res.status(400).json({
        success: false,
        message: "exam_id is required"
      });
    }

    const [result] = await db.query(
      `UPDATE exams
       SET exam_type = ?,
           academic_year = ?,
           class_id = ?,
           section_id = ?,
           start_date = ?,
           end_date = ?
       WHERE exam_id = ?
       AND status != 'cancelled'`,
      [
        exam_type,
        academic_year,
        class_id,
        section_id || null,
        start_date,
        end_date,
        exam_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or already cancelled"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam updated successfully"
    });

  } catch (error) {
    console.error("UpdateExam error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   CANCEL EXAM (ADMIN)
========================= */
exports.CancelExam = async (req, res) => {
  try {
    const { exam_id } = req.params;

    const [result] = await db.query(
      `UPDATE exams
       SET status = 'cancelled'
       WHERE exam_id = ?
       AND status != 'completed'`,
      [exam_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or already completed"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam cancelled successfully"
    });

  } catch (error) {
    console.error("CancelExam error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   CREATE EXAM SUBJECT
========================= */
exports.CreateExamSubject = async (req, res) => {
  try {
    const {
      exam_id,
      subject_id,
      exam_date,
      start_time,
      end_time,
      max_marks,
      passing_marks
    } = req.body;

    if (
      !exam_id ||
      !subject_id ||
      !exam_date ||
      !start_time ||
      !end_time ||
      !max_marks ||
      !passing_marks
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO exam_subjects
       (exam_id, subject_id, exam_date, start_time, end_time, max_marks, passing_marks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        exam_id,
        subject_id,
        exam_date,
        start_time,
        end_time,
        max_marks,
        passing_marks
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Exam subject created successfully",
      exam_subject_id: result.insertId
    });

  } catch (error) {
    console.error("CreateExamSubject error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
