const db = require("../../config/db");

/* =========================================================
   1️⃣ ADD OR UPDATE ASSIGNMENT MARKS
========================================================= */
exports.AddOrUpdateAssignmentMarks = async (req, res) => {
  try {
    const teacher_id = req.teacher ? req.teacher.teacher_id : req.body.teacher_id;

    const { submission_id, marks_obtained, remarks } = req.body;

    if (!submission_id || marks_obtained === undefined) {
      return res.status(400).json({
        success: false,
        message: "submission_id and marks_obtained are required"
      });
    }

    // 1️⃣ Resolve assignment_id and student_id from the submission
    const [[submission]] = await db.query(
      "SELECT assignment_id, student_id FROM assignment_submission WHERE submission_id = ?",
      [submission_id]
    );

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found. Marks can only be added for an existing submission."
      });
    }

    const { assignment_id, student_id } = submission;


    if (!teacher_id) {
        return res.status(400).json({
            success: false,
            message: "teacher_id is required"
        });
    }

    /* Get max marks validation */
    const [[assignment]] = await db.query(
      `SELECT max_marks, teacher_id as creator_id FROM assignments WHERE assignment_id = ?`,
      [assignment_id]
    );

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    if (teacher_id != assignment.creator_id) {
        return res.status(403).json({
            success: false,
            message: "Authorization denied: Only the subject teacher who created this assignment can add/update marks."
        });
    }

    if (parseFloat(marks_obtained) > parseFloat(assignment.max_marks)) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed max marks (${assignment.max_marks})`
      });
    }

    /* Check if marks are already locked */
    const [[existing]] = await db.query(
      `
      SELECT is_locked
      FROM assignment_marks
      WHERE assignment_id = ? AND student_id = ?
      `,
      [assignment_id, student_id]
    );

    if (existing && existing.is_locked) {
      return res.status(403).json({
        success: false,
        message: "Marks are locked and cannot be updated."
      });
    }

    /* Insert or update marks */
    await db.query(
      `
      INSERT INTO assignment_marks
      (assignment_id, student_id, teacher_id, marks_obtained, remarks)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        marks_obtained = VALUES(marks_obtained),
        remarks = VALUES(remarks),
        teacher_id = VALUES(teacher_id)
      `,
      [
        assignment_id,
        student_id,
        teacher_id,
        marks_obtained,
        remarks || null
      ]
    );

    res.status(200).json({
      success: true,
      message: "Marks saved successfully"
    });

  } catch (err) {
    console.error("Add/Update Assignment Marks Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message
    });
  }
};

/* =========================================================
   2️⃣ GET ASSIGNMENT MARKS
========================================================= */
exports.GetAssignmentMarks = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const teacher_id = req.teacher.teacher_id;

    if (!assignment_id) {
        return res.status(400).json({ success: false, message: "assignment_id is required" });
    }

    /* Authorization Check: Only the creator can view marks */
    const [[assignment]] = await db.query(
      `SELECT teacher_id FROM assignments WHERE assignment_id = ?`,
      [assignment_id]
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (teacher_id != assignment.teacher_id) {
      return res.status(403).json({
          success: false,
          message: "Authorization denied: Only the subject teacher who created this assignment can view marks."
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        am.mark_id,
        sp.student_id,
        sp.full_name AS student_name,
        sp.enrollment_no,
        am.marks_obtained,
        a.max_marks,
        ROUND((am.marks_obtained / a.max_marks) * 100, 2) AS percentage,
        am.remarks,
        am.is_locked,
        am.created_at
      FROM assignment_marks am
      JOIN student_profile sp ON sp.student_id = am.student_id
      JOIN assignments a ON a.assignment_id = am.assignment_id
      WHERE am.assignment_id = ?
      `,
      [assignment_id]
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      data: rows
    });

  } catch (err) {
    console.error("Get Assignment Marks Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message
    });
  }
};

/* =========================================================
   3️⃣ LOCK ASSIGNMENT MARKS
========================================================= */
exports.LockAssignmentMarks = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const teacher_id = req.teacher.teacher_id;

    if (!assignment_id) {
        return res.status(400).json({ success: false, message: "assignment_id is required" });
    }

    /* Authorization Check: Only the creator can lock marks */
    const [[assignment]] = await db.query(
      `SELECT teacher_id FROM assignments WHERE assignment_id = ?`,
      [assignment_id]
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (teacher_id != assignment.teacher_id) {
      return res.status(403).json({
          success: false,
          message: "Authorization denied: Only the subject teacher who created this assignment can lock marks."
      });
    }

    const [result] = await db.query(
      `
      UPDATE assignment_marks
      SET is_locked = 1
      WHERE assignment_id = ?
      `,
      [assignment_id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: "No marks found to lock for this assignment."
        });
    }

    res.status(200).json({
      success: true,
      message: "Marks for this assignment have been locked successfully."
    });

  } catch (err) {
    console.error("Lock Assignment Marks Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error: " + err.message
    });
  }
};

/* =========================================================
   4️⃣ GIVE ZERO TO ALL WHO HAVEN'T SUBMITTED
   - Automatically finds students in the class/section who 
     have no record in assignment_submission and gives them 0.
   ========================================================= */
exports.GiveDefaultZeroToAbsentees = async (req, res) => {
  try {
    console.log("GiveDefaultZeroToAbsentees");
    const { assignment_id } = req.body;
    const teacher_id = req.teacher.teacher_id;

    if (!assignment_id) {
      return res.status(400).json({ success: false, message: "assignment_id is required" });
    }

    // 1. Get assignment details (class, section, max_marks)
    const [[assignment]] = await db.query(
      "SELECT class_id, section_id, teacher_id, title FROM assignments WHERE assignment_id = ?",
      [assignment_id]
    );

    if (!assignment) {
      console.log("Assignment not found");
      console.log(assignment);
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (teacher_id != assignment.teacher_id) {
      return res.status(403).json({ success: false, message: "Only the creator of this assignment can do this." });
    }

    // 2. Find students in this class/section who HAVEN'T submitted
    const [absentees] = await db.query(
      `SELECT sp.student_id 
       FROM student_profile sp
       LEFT JOIN assignment_submission asb 
         ON sp.student_id = asb.student_id AND asb.assignment_id = ?
       WHERE sp.class_id = ? AND sp.section_id = ? 
         AND asb.submission_id IS NULL 
         AND sp.status = '1'`,
      [assignment_id, assignment.class_id, assignment.section_id]
    );

    if (absentees.length === 0) {
      return res.status(200).json({ success: true, message: "All students have already submitted work." });
    }

    // 3. Insert 0 marks for these students
    const values = absentees.map(s => [
      assignment_id, 
      s.student_id, 
      teacher_id, 
      0, 
      "Automated: 0 marks for no submission"
    ]);

    await db.query(
      `INSERT IGNORE INTO assignment_marks 
       (assignment_id, student_id, teacher_id, marks_obtained, remarks) 
       VALUES ?`,
      [values]
    );

    res.status(200).json({
      success: true,
      message: `Successfully gave 0 marks to ${absentees.length} students who failed to submit "${assignment.title}".`
    });

  } catch (error) {
    console.error("GiveDefaultZeroToAbsentees Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

