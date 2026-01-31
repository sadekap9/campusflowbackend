const db = require("../../config/db");

/* =====================================================
   1️⃣ GET TEACHER EXAMS
   Assigned Class Teacher: Can see exams for their section.
   Subject Teacher: Can see exams for classes/sections they teach.
===================================================== */
exports.GetTeacherExams = async (req, res) => {
  try {
    const teacher_id = req.teacher.teacher_id;

    // 1. Fetch exams for sections where this teacher is the CLASS TEACHER
    // 2. Fetch exams for sections where this teacher is a SUBJECT TEACHER
    // Use a JOIN approach to find all relevant exams in one go
    
    let query = `
      SELECT DISTINCT
        e.exam_id,
        e.exam_type,
        e.academic_year,
        e.class_id,
        e.section_id,
        DATE_FORMAT(e.start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(e.end_date, '%Y-%m-%d') as end_date,
        e.status,
        c.class_name,
        sec.section_name
      FROM exams e
      JOIN classes c ON e.class_id = c.class_id
      LEFT JOIN sections sec ON e.section_id = sec.section_id
      WHERE 
        -- Rule 1: Teacher is the assigned Class Teacher for this section
        (e.section_id IS NOT NULL AND e.section_id IN (SELECT section_id FROM sections WHERE teacher_id = ?))
        
        -- Rule 2: Teacher is the assigned Class Teacher for the whole class (if section is null)
        OR (e.section_id IS NULL AND e.class_id IN (SELECT class_id FROM sections WHERE teacher_id = ?))

        -- Rule 3: Teacher teaches a subject in this specific section
        OR (e.section_id IS NOT NULL AND e.section_id IN (SELECT section_id FROM teacher_subject WHERE teacher_id = ? AND status = 'active'))

        -- Rule 4: Teacher teaches a subject in this class (if exam is for whole class)
        OR (e.section_id IS NULL AND e.class_id IN (SELECT class_id FROM teacher_subject WHERE teacher_id = ? AND status = 'active'))
      
      ORDER BY e.start_date DESC
    `;

    const [exams] = await db.query(query, [teacher_id, teacher_id, teacher_id, teacher_id]);

    if (exams.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No relevant exams found for your assigned classes/subjects.",
        exams: []
      });
    }

    // Optional: Fetch subjects for each exam to show "like a timetable"
    const examIds = exams.map(e => e.exam_id);
    const [subjects] = await db.query(
      `SELECT 
        es.exam_id,
        es.subject_id,
        s.subject_name,
        es.max_marks,
        es.passing_marks
       FROM exam_subjects es
       JOIN subjects s ON es.subject_id = s.subject_id
       WHERE es.exam_id IN (?)`,
      [examIds]
    );

    // Group subjects by exam_id
    const examsWithSubjects = exams.map(exam => ({
      ...exam,
      subjects: subjects.filter(s => s.exam_id === exam.exam_id)
    }));

    res.status(200).json({
      success: true,
      count: examsWithSubjects.length,
      exams: examsWithSubjects
    });

  } catch (error) {
    console.error("GetTeacherExams Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
};
