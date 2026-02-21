const db = require("../../config/db");

/* =========================================
   GET ALL MARKS SUMMARY (ADMIN)
   Filters: class_id, section_id, exam_id
========================================= */
exports.GetAllMarksSummary = async (req, res) => {
  try {
    const { class_id, section_id, exam_id } = req.query;

    if (!class_id || !exam_id) {
      return res.status(400).json({
        success: false,
        message: "class_id and exam_id are required"
      });
    }

    // 1. Fetch all unique subjects for this exam (shared headers)
    const [examSubjects] = await db.query(
      `SELECT 
         es.exam_subject_id, 
         es.subject_id, 
         es.max_marks,
         es.passing_marks,
         es.exam_date,
         s.subject_name
       FROM exam_subjects es
       JOIN subjects s ON es.subject_id = s.subject_id
       WHERE es.exam_id = ?
       ORDER BY s.subject_name ASC`,
      [exam_id]
    );

    if (examSubjects.length === 0) {
      return res.status(200).json({
        success: true,
        subjects: [],
        data: [],
        message: "No subjects found for this exam"
      });
    }

    // 2. Fetch all students in this class (optionally filtered by section)
    let studentQuery = `
       SELECT student_id, full_name, enrollment_no, status, section_id
       FROM student_profile 
       WHERE class_id = ? 
    `;
    const studentParams = [class_id];
    
    if (section_id) {
        studentQuery += ` AND section_id = ? `;
        studentParams.push(section_id);
    }
    
    studentQuery += ` ORDER BY full_name ASC`;
    const [students] = await db.query(studentQuery, studentParams);

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        subjects: examSubjects.map(s => ({
            name: s.subject_name,
            max_marks: s.max_marks,
            passing_marks: s.passing_marks
        })),
        data: [],
        message: "No students found"
      });
    }

    // 3. Fetch marks for all these students in this exam
    const [allMarks] = await db.query(
      `SELECT 
         m.student_id,
         m.marks_obtained,
         m.grade,
         m.status,
         m.subject_id,
         t.name as teacher_name
       FROM marks m
       LEFT JOIN teachers t ON m.evaluated_by = t.teacher_id
       WHERE m.exam_id = ? AND m.class_id = ? ${section_id ? 'AND m.section_id = ?' : ''}`,
      section_id ? [exam_id, class_id, section_id] : [exam_id, class_id]
    );

    // 4. Fetch attendance for exam dates
    const examDates = [...new Set(examSubjects.map(s => s.exam_date ? s.exam_date.toISOString().split('T')[0] : null).filter(Boolean))];
    let attendanceMap = {};
    if (examDates.length > 0) {
        const [attRows] = await db.query(
            `SELECT student_id, DATE_FORMAT(attendance_date, '%Y-%m-%d') as date, status
             FROM attendance_student
             WHERE class_id = ? AND attendance_date IN (?) ${section_id ? 'AND section_id = ?' : ''}`,
            section_id ? [class_id, examDates, section_id] : [class_id, examDates]
        );
        attRows.forEach(row => {
            attendanceMap[`${row.student_id}-${row.date}`] = row.status;
        });
    }

    // 5. Map everything together
    const reportData = students.map(student => {
        const studentMarks = {};
        
        examSubjects.forEach(sub => {
            const markEntry = allMarks.find(m => m.student_id === student.student_id && m.subject_id === sub.subject_id);
            const dateStr = sub.exam_date ? sub.exam_date.toISOString().split('T')[0] : null;
            const attStatus = dateStr ? (attendanceMap[`${student.student_id}-${dateStr}`] || 'Present') : 'Present';

            studentMarks[sub.subject_name] = markEntry ? {
                obtained: markEntry.marks_obtained,
                grade: markEntry.grade,
                status: markEntry.status,
                evaluated_by: markEntry.teacher_name || 'System',
                attendance: attStatus
            } : {
                obtained: attStatus === 'Absent' ? "ABSENT" : "N/A",
                grade: "-",
                status: attStatus === 'Absent' ? "Absent" : "Pending",
                evaluated_by: attStatus === 'Absent' ? "Attendance" : "Pending",
                attendance: attStatus
            };
        });

        return {
            student_id: student.student_id,
            name: student.full_name,
            enrollment_no: student.enrollment_no,
            marks: studentMarks
        };
    });

    return res.status(200).json({
      success: true,
      subjects: examSubjects.map(s => ({
          name: s.subject_name,
          max_marks: s.max_marks,
          passing_marks: s.passing_marks
      })),
      data: reportData
    });

  } catch (error) {
    console.error("GetAllMarksSummary error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
