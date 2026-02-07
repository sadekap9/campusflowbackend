const db = require("../../config/db");

/* =====================================================
   1️⃣ CREATE ASSIGNMENT & UPLOAD FILES (SINGLE API)
   Strictly following provided table schemas
===================================================== */
exports.createAssignment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      teacher_id: body_teacher_id,
      class_id,
      section_id,
      title,
      description,
      max_marks,
      passing_marks,
      due_date
    } = req.body;

    const teacher_id = body_teacher_id || req.teacher?.teacher_id;

    // 🛑 VALIDATION (Based on NN - Not Null checkboxes in Image 1)
    if (!teacher_id || !class_id || !section_id || !title || !max_marks || !due_date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Required fields missing: teacher_id, class_id, section_id, title, max_marks, and due_date are mandatory."
      });
    }

    /* 🔐 AUTHORIZATION & SUBJECT RETRIEVAL
       Get subject_id (Required NN field) from teacher_subject mapping
    */
    const [assigned] = await connection.query(
      `SELECT subject_id 
       FROM teacher_subject
       WHERE teacher_id = ?
         AND class_id = ?
         AND status = 'active'`,
      [teacher_id, class_id]
    );

    if (assigned.length === 0) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "You are not authorized to post assignments for this class/teacher combination."
      });
    }

    const subject_id = assigned[0].subject_id;

    /* ✅ 1. INSERT INTO assignments (Schema 1) */
    const [result] = await connection.query(
      `INSERT INTO assignments
       (class_id, section_id, subject_id, teacher_id, title, description, max_marks, passing_marks, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        class_id,
        section_id,
        subject_id,
        teacher_id,
        title,
        description || null,   // NULL allowed
        max_marks,             // NN
        passing_marks || null, // NULL allowed
        due_date               // NN
      ]
    );

    const assignment_id = result.insertId;

    /* ✅ 2. INSERT INTO assignment_files (Schema 2) */
    if (req.files && req.files.length > 0) {
      const fileRecords = req.files.map(file => [
        assignment_id, // assignment_id (NN)
        file.path,     // file_path (NN)
        file.mimetype  // file_type (Nullable)
      ]);

      await connection.query(
        `INSERT INTO assignment_files
         (assignment_id, file_path, file_type)
         VALUES ?`,
        [fileRecords]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Assignment created successfully with files",
      assignment_id: assignment_id,
      files: req.files ? req.files.map(f => f.path) : []
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Combined Create Assignment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
};

/* =====================================================
   2️⃣ GET ASSIGNMENTS (GET)
   - Teacher can only see their own uploaded assignments
===================================================== */
exports.getAssignments = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required in the URL"
      });
    }

    let query = `
      SELECT 
        a.assignment_id,
        a.class_id,
        a.section_id,
        a.subject_id,
        a.teacher_id,
        a.title,
        a.description,
        a.max_marks,
        a.passing_marks,
        DATE_FORMAT(a.due_date, '%Y-%m-%d') as due_date,
        a.status,
        CONVERT_TZ(a.created_at, '+00:00', '+05:30') as created_at_ist,
        c.class_name,
        s.section_name,
        sub.subject_name,
        t.name as teacher_name,
        GROUP_CONCAT(DISTINCT af.file_path) as file_paths,
        GROUP_CONCAT(DISTINCT af.file_id) as file_ids
      FROM assignments a
      JOIN classes c ON a.class_id = c.class_id
      JOIN sections s ON a.section_id = s.section_id
      JOIN subjects sub ON a.subject_id = sub.subject_id
      JOIN teachers t ON a.teacher_id = t.teacher_id
      LEFT JOIN assignment_files af ON a.assignment_id = af.assignment_id
      WHERE a.teacher_id = ?
      GROUP BY a.assignment_id 
      ORDER BY a.created_at DESC
    `;

    const [rows] = await db.query(query, [teacher_id]);

    res.json({
      success: true,
      count: rows.length,
      assignments: rows
    });

  } catch (error) {
    console.error("Get Assignments Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   4️⃣ UPDATE ASSIGNMENT (PATCH)
   - Only 'status' and 'due_date' can be updated
   - Ensures security (only creator can update)
===================================================== */
exports.updateAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const {
      teacher_id: body_teacher_id,
      due_date,
      status
    } = req.body;

    const teacher_id = body_teacher_id || req.teacher?.teacher_id;

    if (!teacher_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: teacher_id missing" });
    }

    /* 🔐 OWNER CHECK: Only the teacher who created this assignment can update it */
    const [ownerCheck] = await db.query(
      "SELECT 1 FROM assignments WHERE assignment_id = ? AND teacher_id = ?",
      [assignment_id, teacher_id]
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You did not create this assignment."
      });
    }

    /* 
       ✅ UPDATE ASSIGNMENT
       Only status and due_date are updateable as per requirements.
    */
    const [result] = await db.query(
      `UPDATE assignments SET
        due_date = COALESCE(?, due_date),
        status = COALESCE(?, status)
       WHERE assignment_id = ?`,
      [
        due_date || null,
        status || null,
        assignment_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    res.json({
      success: true,
      message: "Assignment status/due_date updated successfully"
    });

  } catch (error) {
    console.error("Update Assignment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   5️⃣ DELETE ASSIGNMENT FILE (DELETE)
   Ensuring security (only creator can delete)
===================================================== */
exports.deleteAssignmentFile = async (req, res) => {
  try {
    const { file_id } = req.params;
    const { teacher_id: body_teacher_id } = req.body;
    const teacher_id = body_teacher_id || req.teacher?.teacher_id;

    if (!teacher_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: teacher_id missing" });
    }

    /* 🔐 OWNER CHECK: Does this file belong to an assignment created by this teacher? */
    const [fileOwner] = await db.query(
      `SELECT 1 FROM assignment_files af 
       JOIN assignments a ON af.assignment_id = a.assignment_id 
       WHERE af.file_id = ? AND a.teacher_id = ?`,
      [file_id, teacher_id]
    );

    if (fileOwner.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot delete this file."
      });
    }

    const [result] = await db.query(
      `DELETE FROM assignment_files WHERE file_id = ?`,
      [file_id]
    );

    res.json({
      success: true,
      message: "Assignment file deleted"
    });

  } catch (error) {
    console.error("Delete Assignment File Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   6️⃣ DELETE ASSIGNMENT (DELETE)
   Ensuring security (only creator can delete)
===================================================== */
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const { teacher_id: body_teacher_id } = req.body;
    const teacher_id = body_teacher_id || req.teacher?.teacher_id;

    if (!teacher_id) {
      return res.status(401).json({ success: false, message: "Unauthorized: teacher_id missing" });
    }

    /* 🔐 OWNER CHECK: Only the teacher who created this assignment can delete it */
    const [ownerCheck] = await db.query(
      "SELECT 1 FROM assignments WHERE assignment_id = ? AND teacher_id = ?",
      [assignment_id, teacher_id]
    );

    if (ownerCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You did not create this assignment."
      });
    }

    // 1️⃣ Delete files first (FK safety)
    await db.query(
      `DELETE FROM assignment_files WHERE assignment_id = ?`,
      [assignment_id]
    );

    // 2️⃣ Delete the assignment record
    const [result] = await db.query(
      `DELETE FROM assignments WHERE assignment_id = ?`,
      [assignment_id]
    );

    res.json({
      success: true,
      message: "Assignment deleted successfully"
    });

  } catch (error) {
    console.error("Delete Assignment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   7️⃣ GET ALL SUBMISSIONS FOR AN ASSIGNMENT (FOR TEACHER)
   - Returns all students in the target class/section
   - Shows who has submitted and who hasn't
===================================================== */
exports.GetSubmissions = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const teacher_id = req.teacher ? req.teacher.teacher_id : req.query.teacher_id;

    if (!assignment_id) {
      return res.status(400).json({ success: false, message: "assignment_id is required" });
    }

    // 1. Verify this teacher created the assignment
    const [[assignment]] = await db.query(
      "SELECT class_id, section_id, teacher_id FROM assignments WHERE assignment_id = ?",
      [assignment_id]
    );

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (teacher_id != assignment.teacher_id) {
      return res.status(403).json({ success: false, message: "Unauthorized: You did not create this assignment" });
    }

    // 2. Get all students in that class/section and their submission status
    const [submissions] = await db.query(
      `SELECT 
        sp.student_id,
        sp.full_name,
        sp.enrollment_no,
        sub.submission_id,
        sub.file_path,
        sub.file_type,
        sub.submitted_on,
        sub.is_late,
        sub.status as submission_status,
        am.marks_obtained,
        am.is_locked
      FROM student_profile sp
      LEFT JOIN assignment_submission sub 
        ON sp.student_id = sub.student_id AND sub.assignment_id = ?
      LEFT JOIN assignment_marks am
        ON sp.student_id = am.student_id AND am.assignment_id = ?
      WHERE sp.class_id = ? AND sp.section_id = ?
      ORDER BY sp.full_name ASC`,
      [assignment_id, assignment_id, assignment.class_id, assignment.section_id]
    );

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });

  } catch (error) {
    console.error("GetSubmissions Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

