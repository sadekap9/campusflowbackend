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
      start_date,
      end_date
    } = req.body;
console.log(start_date)
    if (!exam_type || !academic_year || !class_id || !start_date) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }

    // Check if an exam already exists for this class on the same start date
    const [existing] = await db.query(
      `SELECT exam_id FROM exams 
       WHERE class_id = ? 
       AND start_date = ? 
       AND status != 'cancelled'`,
      [class_id, start_date]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An exam is already scheduled for this class on this date. Please update the existing exam instead."
      });
    }

    const [result] = await db.query(
      `INSERT INTO exams
       (exam_type, academic_year, class_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, 'scheduled')`,
      [exam_type, academic_year, class_id, start_date, end_date]
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
      start_date,
      end_date
    } = req.body;

    if (!exam_id) {
      return res.status(400).json({
        success: false,
        message: "exam_id is required"
      });
    }

    // Check for clash if class_id or start_date is being updated
    if (class_id && start_date) {
      const [existing] = await db.query(
        `SELECT exam_id FROM exams 
         WHERE class_id = ? 
         AND start_date = ? 
         AND exam_id != ? 
         AND status != 'cancelled'`,
        [class_id, start_date, exam_id]
      );

      if (existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Another exam is already scheduled for this class on this date."
        });
      }
    }

    const [result] = await db.query(
      `UPDATE exams
       SET exam_type = ?,
           academic_year = ?,
           class_id = ?,
           start_date = ?,
           end_date = ?
       WHERE exam_id = ?
       AND status != 'cancelled'`,
      [
        exam_type,
        academic_year,
        class_id,
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
   DELETE EXAM (ADMIN)
 ========================= */
exports.DeleteExam = async (req, res) => {
  try {
    const { exam_id } = req.params;

    // 1. Delete associated subjects first
    await db.query("DELETE FROM exam_subjects WHERE exam_id = ?", [exam_id]);

    // 2. Delete the exam
    const [result] = await db.query("DELETE FROM exams WHERE exam_id = ?", [exam_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam and associated subjects deleted successfully"
    });

  } catch (error) {
    console.error("DeleteExam error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


/* =========================
   GET ALL EXAMS
 ========================= */
exports.GetAllExams = async (req, res) => {
  try {
    let query = `
      SELECT e.*, c.class_name 
      FROM exams e
      JOIN classes c ON e.class_id = c.class_id
    `;

    const [rows] = await db.query(query);
console.log(rows)
    return res.status(200).json({
      success: true,
      exams: rows
    });

  } catch (error) {
    console.error("GetExams error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   GET EXAM SUBJECTS
 ========================= */
exports.GetExamSubjects = async (req, res) => {
  try {
    const { exam_id } = req.params;

    if (!exam_id) {
      return res.status(400).json({
        success: false,
        message: "exam_id is required"
      });
    }

    const [rows] = await db.query(
      `SELECT es.*, s.subject_name 
       FROM exam_subjects es
       JOIN subjects s ON es.subject_id = s.subject_id
       WHERE es.exam_id = ?
       ORDER BY es.exam_date ASC, es.start_time ASC`,
      [exam_id]
    );
console.log(rows)
    return res.status(200).json({
      success: true,
      subjects: rows
    });

  } catch (error) {
    console.error("GetExamSubjects error:", error);
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

    // 1. Check if this specific subject is already added to this exam
    const [existingSubject] = await db.query(
      "SELECT exam_subject_id FROM exam_subjects WHERE exam_id = ? AND subject_id = ?",
      [exam_id, subject_id]
    );

    if (existingSubject.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This subject is already added to this exam."
      });
    }

    // 2. Check for class-wide time conflict (same class, same date, same time)
    // First, get the class_id and section_id for the given exam_id
    const [[examInfo]] = await db.query(
      "SELECT class_id FROM exams WHERE exam_id = ?",
      [exam_id]
    );

    if (!examInfo) {
      return res.status(404).json({
        success: false,
        message: "Parent exam not found"
      });
    }

    // Check if any other subject is scheduled for this class at the same date and overlapping time
    const [timeClash] = await db.query(
      `SELECT es.exam_subject_id FROM exam_subjects es
       JOIN exams e ON es.exam_id = e.exam_id
       WHERE e.class_id = ? 
       AND es.exam_date = ? 
       AND e.status != 'cancelled'
       AND (
         (es.start_time < ? AND es.end_time > ?)
       )`,
      [examInfo.class_id, exam_date, end_time, start_time]
    );

    if (timeClash.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Time conflict! Another subject is already scheduled for this class during this time range."
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

/* =========================
   UPDATE EXAM SUBJECT
 ========================= */
exports.UpdateExamSubject = async (req, res) => {
  try {
    const { exam_subject_id } = req.params;
    const {
      subject_id,
      exam_date,
      start_time,
      end_time,
      max_marks,
      passing_marks
    } = req.body;

    if (!exam_subject_id) {
      return res.status(400).json({
        success: false,
        message: "exam_subject_id is required"
      });
    }

    // Get current subject info to check for clashes
    const [[current]] = await db.query(
      "SELECT exam_id FROM exam_subjects WHERE exam_subject_id = ?",
      [exam_subject_id]
    );

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Exam subject not found"
      });
    }

    const { exam_id } = current;

    // Optional: Re-validate class-wide time conflict if time/date changes
    if (exam_date && start_time && end_time) {
      const [[examInfo]] = await db.query(
        "SELECT class_id FROM exams WHERE exam_id = ?",
        [exam_id]
      );

      const [timeClash] = await db.query(
        `SELECT es.exam_subject_id FROM exam_subjects es
         JOIN exams e ON es.exam_id = e.exam_id
         WHERE e.class_id = ? 
         AND es.exam_date = ? 
         AND e.status != 'cancelled'
         AND es.exam_subject_id != ?
         AND (
           (es.start_time < ? AND es.end_time > ?)
         )`,
        [examInfo.class_id, exam_date, exam_subject_id, end_time, start_time]
      );

      if (timeClash.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Time conflict! Another subject is already scheduled for this class during this time range."
        });
      }
    }

    await db.query(
      `UPDATE exam_subjects
       SET subject_id = ?,
           exam_date = ?,
           start_time = ?,
           end_time = ?,
           max_marks = ?,
           passing_marks = ?
       WHERE exam_subject_id = ?`,
      [subject_id, exam_date, start_time, end_time, max_marks, passing_marks, exam_subject_id]
    );

    return res.status(200).json({
      success: true,
      message: "Exam subject updated successfully"
    });

  } catch (error) {
    console.error("UpdateExamSubject error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================
   DELETE EXAM SUBJECT
 ========================= */
exports.DeleteExamSubject = async (req, res) => {
  try {
    const { exam_subject_id } = req.params;

    const [result] = await db.query(
      "DELETE FROM exam_subjects WHERE exam_subject_id = ?",
      [exam_subject_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Exam subject not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exam subject deleted successfully"
    });

  } catch (error) {
    console.error("DeleteExamSubject error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
