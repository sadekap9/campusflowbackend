const db = require("../../config/db");

/* =========================================================
   GET STUDENT'S EXAMS AND SUBJECTS
   ========================================================= */
exports.GetMyExams = async (req, res) => {
  try {
    const { student_id } = req.params;

    // 1️⃣ Get student's class information
    const [studentRows] = await db.query(
      "SELECT class_id FROM student_profile WHERE student_id = ?",
      [student_id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const { class_id } = studentRows[0];

    // 2️⃣ Get exams for this class
    const [exams] = await db.query(
      `SELECT 
        exam_id, 
        exam_type, 
        academic_year, 
        start_date, 
        end_date, 
        status 
      FROM exams 
      WHERE class_id = ? AND status != 'cancelled'
      ORDER BY start_date DESC`,
      [class_id]
    );

    // 3️⃣ For each exam, fetch its subjects
    const enrichedExams = await Promise.all(
      exams.map(async (exam) => {
        const [subjects] = await db.query(
          `SELECT 
            es.exam_subject_id,
            sub.subject_name,
            sub.subject_code,
            es.max_marks,
            es.passing_marks,
            es.exam_date,
            es.start_time,
            es.end_time,
            es.status AS subject_status
          FROM exam_subjects es
          JOIN subjects sub ON es.subject_id = sub.subject_id
          WHERE es.exam_id = ? AND es.status != 'cancelled'
          ORDER BY es.exam_date, es.start_time`,
          [exam.exam_id]
        );

        return {
          ...exam,
          subjects: subjects
        };
      })
    );

    res.status(200).json({
      success: true,
      count: exams.length,
      exams: enrichedExams
    });

  } catch (error) {
    console.error("GetMyExams Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================================================
   GET STUDENT'S MARKS / GRADES FOR A SPECIFIC EXAM
   - Mandatory: exam_id
   - Optional: exam_subject_id (for subject-wise view)
   ========================================================= */
exports.GetMyExamMarks = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { exam_id, exam_subject_id } = req.query;

    if (!exam_id) {
      return res.status(400).json({
        success: false,
        message: "exam_id is required."
      });
    }

    let query = `
      SELECT 
        m.mark_id,
        e.exam_type,
        e.academic_year,
        sub.subject_name,
        sub.subject_code,
        es.max_marks,
        es.passing_marks,
        m.marks_obtained,
        m.percentage,
        m.grade,
        m.status,
        m.remarks,
        t.name as evaluated_by_name
      FROM marks m
      JOIN exams e ON e.exam_id = m.exam_id
      JOIN exam_subjects es ON es.exam_subject_id = m.exam_subject_id
      JOIN subjects sub ON sub.subject_id = es.subject_id
      LEFT JOIN teachers t ON t.teacher_id = m.evaluated_by
      WHERE m.student_id = ? AND m.exam_id = ?
    `;

    const params = [student_id, exam_id];

    if (exam_subject_id) {
      query += " AND m.exam_subject_id = ?";
      params.push(exam_subject_id);
    }

    query += " ORDER BY sub.subject_name ASC";

    const [marks] = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: marks.length,
      data: marks
    });

  } catch (error) {
    console.error("GetMyExamMarks Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
