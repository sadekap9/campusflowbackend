const db = require("../../config/db");

/* =========================================================
   1️⃣ GRADE EXAM SUBJECT MARKS (SUBJECT TEACHER ONLY)
========================================================= */
exports.GradeExamMarks = async (req, res) => {
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
      SELECT exam_id, status
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

    if (exam.status !== 'completed') {
      return res.status(403).json({
        success: false,
        message: "Access denied: Marks can only be added if the exam status is 'completed'."
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
/* =========================================================
   2️⃣ VIEW EXAM MARKS (SUBJECT TO SUBJECT TEACHER)
   - Only returns marks for subjects the teacher actually teaches.
========================================================= */
exports.GetSubjectTeacherMarks = async (req, res) => {
  try {
    const teacher_id = req.teacher.teacher_id;
    const { exam_subject_id, section_id } = req.query;

    if (!exam_subject_id || !section_id) {
      return res.status(400).json({
        success: false,
        message: "exam_subject_id and section_id are required"
      });
    }

    /* 1️⃣ AUTHORIZATION Check: Is this the Subject Teacher? */
    const [[auth]] = await db.query(
      `
      SELECT 1
      FROM teacher_subject ts
      JOIN exam_subjects es ON es.subject_id = ts.subject_id
      JOIN exams e ON e.exam_id = es.exam_id
      WHERE ts.teacher_id = ?
        AND es.exam_subject_id = ?
        AND ts.class_id = e.class_id
        AND ts.status = 'active'
      `,
      [teacher_id, exam_subject_id]
    );

    if (!auth) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not the subject teacher for this exam subject."
      });
    }

    /* 2️⃣ FETCH MARKS */
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
        m.evaluated_by,
        t.name AS evaluated_by_name
      FROM marks m
      JOIN student_profile sp ON sp.student_id = m.student_id
      LEFT JOIN teachers t ON t.teacher_id = m.evaluated_by
      WHERE m.exam_subject_id = ?
        AND m.section_id = ?
      ORDER BY sp.full_name
      `,
      [exam_subject_id, section_id]
    );

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("GetSubjectTeacherMarks Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   3️⃣ VIEW EXAM MARKS (SUBJECT TO CLASS TEACHER)
   - Allows Class Teacher to see marks of any subject in their class.
========================================================= */
exports.GetClassTeacherMarks = async (req, res) => {
  try {
    const teacher_id = req.teacher.teacher_id;
    const { exam_id, section_id, exam_subject_id } = req.query;

    if (!exam_id || !section_id) {
      return res.status(400).json({
        success: false,
        message: "exam_id and section_id are required"
      });
    }

    /* 1️⃣ AUTHORIZATION Check: Is this the Class Teacher? */
    const [[isClassTeacher]] = await db.query(
      `SELECT 1 FROM sections WHERE section_id = ? AND teacher_id = ?`,
      [section_id, teacher_id]
    );

    if (!isClassTeacher) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not the class teacher of this section."
      });
    }

    /* 2️⃣ FETCH MARKS (Filtered by subject if provided, otherwise shows all results for the exam) */
    let query = `
      SELECT
        m.mark_id,
        sp.student_id,
        sp.full_name,
        sp.enrollment_no,
        sub.subject_name,
        m.marks_obtained,
        es.max_marks,
        m.percentage,
        m.grade,
        m.status,
        m.evaluated_by,
        t.name AS evaluated_by_name
      FROM marks m
      JOIN student_profile sp ON sp.student_id = m.student_id
      JOIN exam_subjects es ON es.exam_subject_id = m.exam_subject_id
      JOIN subjects sub ON sub.subject_id = es.subject_id
      LEFT JOIN teachers t ON t.teacher_id = m.evaluated_by
      WHERE m.exam_id = ? AND m.section_id = ?
    `;

    const params = [exam_id, section_id];

    if (exam_subject_id) {
      query += ` AND m.exam_subject_id = ?`;
      params.push(exam_subject_id);
    }

    query += ` ORDER BY sp.full_name, sub.subject_name`;

    const [rows] = await db.query(query, params);

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (error) {
    console.error("GetClassTeacherMarks Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   4️⃣ VIEW FULL STUDENT RESULT (CLASS TEACHER ONLY)
   - Allows Class Teacher to see a student's full result for an exam.
========================================================= */
exports.GetStudentFullResult = async (req, res) => {
  try {
    const teacher_id = req.teacher.teacher_id;
    const { exam_id, student_id } = req.query;

    if (!exam_id || !student_id) {
      return res.status(400).json({
        success: false,
        message: "exam_id and student_id are required"
      });
    }

    /* 1️⃣ AUTHORIZATION Check: Is this the Class Teacher for this student? */
    const [[studentInfo]] = await db.query(
      `
      SELECT sp.section_id, s.teacher_id AS class_teacher_id
      FROM student_profile sp
      JOIN sections s ON s.section_id = sp.section_id
      WHERE sp.student_id = ?
      `,
      [student_id]
    );

    if (!studentInfo) {
      return res.status(404).json({
        success: false,
        message: "Student not found or section not assigned."
      });
    }

    if (studentInfo.class_teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You are not the class teacher for this student."
      });
    }

    /* 2️⃣ FETCH ALL MARKS FOR THE STUDENT IN THE EXAM */
    const [marks] = await db.query(
      `
      SELECT
        sub.subject_name,
        m.marks_obtained,
        es.max_marks,
        es.passing_marks,
        m.percentage,
        m.grade,
        m.status,
        m.remarks,
        t.name AS evaluated_by
      FROM marks m
      JOIN exam_subjects es ON es.exam_subject_id = m.exam_subject_id
      JOIN subjects sub ON sub.subject_id = es.subject_id
      LEFT JOIN teachers t ON t.teacher_id = m.evaluated_by
      WHERE m.exam_id = ? AND m.student_id = ?
      ORDER BY sub.subject_name
      `,
      [exam_id, student_id]
    );

    if (marks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No marks found for this student in the specified exam."
      });
    }

    /* 3️⃣ CALCULATE SUMMARY */
    let totalObtained = 0;
    let totalMax = 0;
    let anyFailed = false;

    marks.forEach(m => {
      totalObtained += Number(m.marks_obtained);
      totalMax += Number(m.max_marks);
      if (m.status === 'failed') anyFailed = true;
    });

    const overallPercentage = ((totalObtained / totalMax) * 100).toFixed(2);
    
    let overallGrade = "F";
    if (overallPercentage >= 90) overallGrade = "A+";
    else if (overallPercentage >= 80) overallGrade = "A";
    else if (overallPercentage >= 70) overallGrade = "B";
    else if (overallPercentage >= 60) overallGrade = "C";
    else if (overallPercentage >= 50) overallGrade = "D";
    else if (overallPercentage >= 40) overallGrade = "E";

    const overallStatus = anyFailed ? "failed" : "passed";

    return res.status(200).json({
      success: true,
      student_id,
      exam_id,
      summary: {
        total_obtained: totalObtained,
        total_max: totalMax,
        percentage: overallPercentage,
        grade: overallGrade,
        status: overallStatus
      },
      marks: marks
    });

  } catch (error) {
    console.error("GetStudentFullResult Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

