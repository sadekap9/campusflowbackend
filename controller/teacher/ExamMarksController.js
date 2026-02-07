const db = require("../../config/db");

/* =========================================================
   1️⃣ GRADE EXAM SUBJECT MARKS (SUBJECT TEACHER ONLY)
========================================================= */
exports.GradeExamMarks = async (req, res) => {
  console.log("GradeExamMarks");
  try {
    const teacher_id = req.teacher.teacher_id;
    const {
      exam_id,
      exam_subject_id,
      student_id,
      marks_obtained,
      remarks
    } = req.body;

    /* =========================
       0️⃣ BASIC VALIDATION
    ========================= */
    if (!exam_id || !exam_subject_id || !student_id || marks_obtained === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: exam_id, exam_subject_id, student_id, marks_obtained"
      });
    }

    /* =========================
       1️⃣ GET STUDENT (class + section)
    ========================= */
    const [[student]] = await db.query(
      `
      SELECT class_id, section_id
      FROM student_profile
      WHERE student_id = ?
      `,
      [student_id]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const { class_id, section_id } = student;

    /* =========================
       2️⃣ VALIDATE EXAM
    ========================= */
    const [[exam]] = await db.query(
      `
      SELECT exam_id
      FROM exams
      WHERE exam_id = ? AND class_id = ?
      `,
      [exam_id, class_id]
    );

    if (!exam) {
      return res.status(400).json({
        success: false,
        message: "Exam does not belong to student's class"
      });
    }

    /* =========================
       3️⃣ EXAM SUBJECT DETAILS
    ========================= */
    const [[examSubject]] = await db.query(
      `
      SELECT subject_id, max_marks, passing_marks
      FROM exam_subjects
      WHERE exam_subject_id = ?
      `,
      [exam_subject_id]
    );

    if (!examSubject) {
      return res.status(404).json({
        success: false,
        message: "Exam subject not found"
      });
    }

    const { subject_id, max_marks, passing_marks } = examSubject;

    /* =========================
       4️⃣ SUBJECT TEACHER AUTH
    ========================= */
    const [[assignment]] = await db.query(
      `
      SELECT 1
      FROM teacher_subject
      WHERE teacher_id = ?
        AND class_id = ?
        AND subject_id = ?
        AND status = 'active'
      `,
      [teacher_id, class_id, subject_id]
    );

    if (!assignment) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not the subject teacher"
      });
    }

    /* =========================
       5️⃣ MARKS VALIDATION
    ========================= */
    if (Number(marks_obtained) > Number(max_marks)) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed ${max_marks}`
      });
    }

    /* =========================
       6️⃣ RESULT CALCULATION
    ========================= */
    const percentage = ((marks_obtained / max_marks) * 100).toFixed(2);
    const status = marks_obtained >= passing_marks ? "passed" : "failed";

    let grade = "F";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 60) grade = "C";
    else if (percentage >= 50) grade = "D";
    else if (percentage >= 40) grade = "E";

    /* =========================
       7️⃣ INSERT / UPDATE
    ========================= */
    await db.query(
      `
      INSERT INTO marks (
        exam_id,
        exam_subject_id,
        student_id,
        class_id,
        section_id,
        subject_id,
        marks_obtained,
        percentage,
        grade,
        status,
        evaluated_by,
        remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        marks_obtained = VALUES(marks_obtained),
        percentage = VALUES(percentage),
        grade = VALUES(grade),
        status = VALUES(status),
        remarks = VALUES(remarks),
        evaluated_by = VALUES(evaluated_by)
      `,
      [
        exam_id,
        exam_subject_id,
        student_id,
        class_id,
        section_id,
        subject_id,
        marks_obtained,
        percentage,
        grade,
        status,
        teacher_id,
        remarks || null
      ]
    );

    return res.json({
      success: true,
      message: "Marks graded successfully",
      data: { percentage, grade, status }
    });

  } catch (err) {
    console.error("GradeExamMarks Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* =========================================================
   2️⃣ VIEW EXAM MARKS
========================================================= */
exports.GetExamMarks = async (req, res) => {
  try {
    const teacher_id = req.teacher.teacher_id;
    const { exam_id, exam_subject_id, section_id } = req.query;

    if (!exam_id || !exam_subject_id || !section_id) {
      return res.status(400).json({
        success: false,
        message: "exam_id, exam_subject_id, section_id are required"
      });
    }

    /* =====================================================
       1️⃣ GET EXAM & SUBJECT
    ===================================================== */
    const [[exam]] = await db.query(
      "SELECT class_id FROM exams WHERE exam_id = ?",
      [exam_id]
    );

    const [[es]] = await db.query(
      "SELECT subject_id FROM exam_subjects WHERE exam_subject_id = ?",
      [exam_subject_id]
    );

    if (!exam || !es) {
      return res.status(404).json({
        success: false,
        message: "Exam or subject not found"
      });
    }

    const { class_id } = exam;
    const { subject_id } = es;

    /* =====================================================
       2️⃣ AUTHORIZATION
    ===================================================== */
    const [[isSubjectTeacher]] = await db.query(
      `
      SELECT 1
      FROM teacher_subject
      WHERE teacher_id = ?
        AND class_id = ?
        AND subject_id = ?
        AND status = 'active'
      `,
      [teacher_id, class_id, subject_id]
    );

    const [[isClassTeacher]] = await db.query(
      `
      SELECT 1
      FROM sections
      WHERE section_id = ? AND teacher_id = ?
      `,
      [section_id, teacher_id]
    );

    if (!isSubjectTeacher && !isClassTeacher) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    /* =====================================================
       3️⃣ FETCH MARKS
    ===================================================== */
    const [rows] = await db.query(
      `
      SELECT
        m.mark_id,
        sp.student_id,
        sp.full_name,
        sp.enrollment_no,
        m.marks_obtained,
        m.percentage,
        m.grade,
        m.status,
        m.remarks,
        t.name AS evaluated_by_name
      FROM marks m
      JOIN student_profile sp ON sp.student_id = m.student_id
      LEFT JOIN teachers t ON t.teacher_id = m.evaluated_by
      WHERE m.exam_id = ?
        AND m.exam_subject_id = ?
        AND m.section_id = ?
      ORDER BY sp.full_name
      `,
      [exam_id, exam_subject_id, section_id]
    );

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("GetExamMarks Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
