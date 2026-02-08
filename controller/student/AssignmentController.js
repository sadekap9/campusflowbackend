const db = require("../../config/db");

/* =========================================================
   1️⃣ GET ALL ASSIGNMENTS (WITH SUBMISSION & MARKS)
   - Specifically designed for the Student Portal
   ========================================================= */
exports.GetMyAssignments = async (req, res) => {
  try {
    const { student_id } = req.params;

    // Verify student and get their current class/section
    const [studentRows] = await db.query(
      "SELECT class_id, section_id FROM student_profile WHERE student_id = ?",
      [student_id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const { class_id, section_id } = studentRows[0];

    // Fetch assignments with subject, teacher, submission details, and marks
    const [assignments] = await db.query(
      `SELECT 
        a.assignment_id,
        a.title,
        a.description,
        a.max_marks,
        a.passing_marks,
        a.due_date,
        sub.subject_name,
        sub.subject_code,
        t.name AS teacher_name,
        
        -- Status Logic: If submitted, show that. If not, show Pending or Not Submitted based on date.
        CASE 
          WHEN s.status IS NOT NULL THEN s.status
          WHEN CURDATE() > a.due_date THEN 'not_submitted'
          ELSE 'pending'
        END AS assignment_status,

        s.file_path AS my_submission_file,
        s.submitted_on AS my_submission_date,
        s.is_late AS submission_timing,
        
        -- Get marks if they are locked/finalized
        m.marks_obtained,
        m.remarks AS teacher_remarks,
        m.is_locked
      FROM assignments a
      JOIN subjects sub ON a.subject_id = sub.subject_id
      JOIN teachers t ON a.teacher_id = t.teacher_id
      LEFT JOIN assignment_submission s 
        ON a.assignment_id = s.assignment_id AND s.student_id = ?
      LEFT JOIN assignment_marks m 
        ON a.assignment_id = m.assignment_id AND m.student_id = ?
      WHERE a.class_id = ? AND a.section_id = ? AND a.status = 'active'
      ORDER BY a.due_date DESC`,
      [student_id, student_id, class_id, section_id]

    );

    // Get attachments (files uploaded by teachers) for each assignment
    const enrichedAssignments = await Promise.all(
      assignments.map(async (a) => {
        const [files] = await db.query(
          "SELECT file_id, file_path FROM assignment_files WHERE assignment_id = ?",
          [a.assignment_id]
        );
        return { ...a, assignment_attachments: files };
      })
    );

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments: enrichedAssignments
    });

  } catch (error) {
    console.error("GetMyAssignments Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   2️⃣ SUBMIT ASSIGNMENT (FILE UPLOAD)
   - Handles both initial submission and updates
   ========================================================= */
exports.SubmitAssignment = async (req, res) => {
  try {
    const { student_id, assignment_id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Check if the assignment exists and is active
    const [assignment] = await db.query(
      "SELECT due_date FROM assignments WHERE assignment_id = ? AND status = 'active'",
      [assignment_id]
    );

    if (assignment.length === 0) {
      return res.status(404).json({ success: false, message: "Assignment not found or inactive" });
    }

    // Determine if submission is late based on schema enum ('LATE', 'ONTIME')
    const dueDate = new Date(assignment[0].due_date);
    const submissionDate = new Date();
    const isLate = submissionDate > dueDate ? 'LATE' : 'ONTIME';

    const filePath = file.path;
    const fileType = file.mimetype;

    // Check if a submission already exists for this student/assignment
    const [existing] = await db.query(
      "SELECT submission_id FROM assignment_submission WHERE assignment_id = ? AND student_id = ?",
      [assignment_id, student_id]
    );

    if (existing.length > 0) {
      // Update existing record
      await db.query(
        `UPDATE assignment_submission 
         SET file_path = ?, file_type = ?, submitted_on = CURRENT_TIMESTAMP, is_late = ?, status = 'submitted'
         WHERE assignment_id = ? AND student_id = ?`,
        [filePath, fileType, isLate, assignment_id, student_id]
      );
    } else {
      // Create new record
      await db.query(
        `INSERT INTO assignment_submission 
          (assignment_id, student_id, file_path, file_type, is_late, status)
         VALUES (?, ?, ?, ?, ?, 'submitted')`,
        [assignment_id, student_id, filePath, fileType, isLate]
      );
    }

    res.status(201).json({
      success: true,
      message: `Assignment successfully submitted (${isLate})`,
      file_path: filePath
    });

  } catch (error) {
    console.error("SubmitAssignment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =========================================================
   3️⃣ GET MY GRADES (FINALIZED MARKS ONLY)
   - Returns ONLY assignments where marks are locked by teacher
   ========================================================= */
exports.GetMyGrades = async (req, res) => {
  try {
    const { student_id } = req.params;

    const [grades] = await db.query(
      `SELECT 
        a.assignment_id,
        a.title,
        sub.subject_name,
        a.max_marks,
        m.marks_obtained,
        m.remarks AS teacher_remarks,
        m.created_at AS graded_on,
        ROUND((m.marks_obtained / a.max_marks) * 100, 2) AS percentage
      FROM assignment_marks m
      JOIN assignments a ON m.assignment_id = a.assignment_id
      JOIN subjects sub ON a.subject_id = sub.subject_id
      WHERE m.student_id = ?
      ORDER BY m.created_at DESC`,
      [student_id]
    );

    res.status(200).json({
      success: true,
      count: grades.length,
      data: grades
    });

  } catch (error) {
    console.error("GetMyGrades Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
