const db = require("../../config/db");

/* =========================================================
   1️⃣ GET EXAMS FOR CLASS TEACHER
   - Teacher sees ALL exams of the class they are class teacher of
   - Uses sections.teacher_id
========================================================= */
exports.GetClassTeacherExams = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required"
      });
    }

    const [exams] = await db.query(
      `
      SELECT DISTINCT
        e.exam_id,
        e.exam_type,
        e.academic_year,
        DATE_FORMAT(e.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(e.end_date, '%Y-%m-%d') AS end_date,
        e.status AS exam_status,

        es.exam_subject_id,
        DATE_FORMAT(es.exam_date, '%Y-%m-%d') AS exam_date,
        es.start_time,
        es.end_time,
        es.max_marks,
        es.passing_marks,
        es.status AS subject_exam_status,

        c.class_id,
        c.class_name,
        sec.section_id,
        sec.section_name,
        sub.subject_id,
        sub.subject_name
      FROM exams e
      JOIN exam_subjects es ON es.exam_id = e.exam_id
      JOIN classes c ON c.class_id = e.class_id
      JOIN sections sec ON sec.class_id = e.class_id
      JOIN subjects sub ON sub.subject_id = es.subject_id
      WHERE sec.teacher_id = ?
      ORDER BY exam_date DESC, es.start_time ASC
      `,
      [teacher_id]
    );

    return res.status(200).json({
      success: true,
      role: "class_teacher",
      total: exams.length,
      exams
    });

  } catch (error) {
    console.error("GetClassTeacherExams error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
};

/* =========================================================
   2️⃣ GET EXAMS FOR SUBJECT TEACHER
   - Teacher sees ONLY exams of subjects they teach
   - Uses teacher_subject mapping
========================================================= */
exports.GetSubjectTeacherExams = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required"
      });
    }

    const [exams] = await db.query(
      `
      SELECT DISTINCT
        e.exam_id,
        e.exam_type,
        e.academic_year,
        DATE_FORMAT(e.start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(e.end_date, '%Y-%m-%d') AS end_date,
        e.status AS exam_status,

        es.exam_subject_id,
        DATE_FORMAT(es.exam_date, '%Y-%m-%d') AS exam_date,
        es.start_time,
        es.end_time,
        es.max_marks,
        es.passing_marks,
        es.status AS subject_exam_status,

        c.class_id,
        c.class_name,
        sub.subject_id,
        sub.subject_name
      FROM exams e
      JOIN exam_subjects es ON es.exam_id = e.exam_id
      JOIN teacher_subject ts
        ON ts.class_id = e.class_id
       AND ts.subject_id = es.subject_id
       AND ts.status = 'active'
      JOIN classes c ON c.class_id = e.class_id
      JOIN subjects sub ON sub.subject_id = es.subject_id
      WHERE ts.teacher_id = ?
      ORDER BY exam_date DESC, es.start_time ASC
      `,
      [teacher_id]
    );

    return res.status(200).json({
      success: true,
      role: "subject_teacher",
      total: exams.length,
      exams
    });

  } catch (error) {
    console.error("GetSubjectTeacherExams error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
};
