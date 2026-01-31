const db = require("../../config/db");

/* =====================================================
   1️⃣ CREATE ASSIGNMENT (ONLY SUBJECT TEACHER CAN POST)
===================================================== */
exports.createAssignment = async (req, res) => {
  try {
    const teacher_id = req.teacher.teacher_id; // 🔐 from JWT
    const {
      class_id,
      section_id,
      subject_id,
      title,
      description,
      max_marks,
      passing_marks,
      due_date
    } = req.body;

    if (!class_id || !section_id || !subject_id || !title || !due_date) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    /* 🔐 AUTHORIZATION CHECK
       Is this teacher assigned to this subject + class?
    */
    const [assigned] = await db.query(
      `SELECT teacher_subject_id 
       FROM teacher_subject
       WHERE teacher_id = ?
         AND class_id = ?
         AND subject_id = ?
         AND status = 'active'`,
      [teacher_id, class_id, subject_id]
    );

    if (assigned.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to post assignment for this subject"
      });
    }

    /* ✅ CREATE ASSIGNMENT */
    const [result] = await db.query(
      `INSERT INTO assignments
       (class_id, section_id, subject_id, teacher_id, title, description, max_marks, passing_marks, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        class_id,
        section_id,
        subject_id,
        teacher_id,
        title,
        description || null,
        max_marks || null,
        passing_marks || null,
        due_date
      ]
    );

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment_id: result.insertId
    });

  } catch (error) {
    console.error("Create Assignment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   2️⃣ UPLOAD ASSIGNMENT FILES (POST)
===================================================== */
exports.uploadAssignmentFiles = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const teacher_id = req.teacher.teacher_id;
    
    // 🔐 SECURITY CHECK: Ensure this teacher owns the assignment
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

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const fileRecords = req.files.map(file => [
      assignment_id,
      file.path,
      file.mimetype
    ]);

    await db.query(
      `INSERT INTO assignment_files
       (assignment_id, file_path, file_type)
       VALUES ?`,
      [fileRecords]
    );

    res.status(201).json({
      success: true,
      message: `${req.files.length} file(s) uploaded successfully`,
      files: req.files.map(f => f.path)
    });

  } catch (error) {
    console.error("Upload Assignment Files Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   3️⃣ GET ASSIGNMENTS (GET)
===================================================== */
exports.getAssignments = async (req, res) => {
  try {
    const { class_id, section_id, subject_id, teacher_id } = req.query;

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
        GROUP_CONCAT(af.file_path) as file_paths,
        GROUP_CONCAT(af.file_type) as file_types
      FROM assignments a
      JOIN classes c ON a.class_id = c.class_id
      JOIN sections s ON a.section_id = s.section_id
      JOIN subjects sub ON a.subject_id = sub.subject_id
      JOIN teachers t ON a.teacher_id = t.teacher_id
      LEFT JOIN assignment_files af ON a.assignment_id = af.assignment_id
      WHERE 1 = 1
    `;

    const params = [];

    if (class_id) {
      query += " AND a.class_id = ?";
      params.push(class_id);
    }
    if (section_id) {
      query += " AND a.section_id = ?";
      params.push(section_id);
    }
    if (subject_id) {
      query += " AND a.subject_id = ?";
      params.push(subject_id);
    }
    if (teacher_id) {
      query += " AND a.teacher_id = ?";
      params.push(teacher_id);
    }

    query += " GROUP BY a.assignment_id ORDER BY a.created_at DESC";

    const [rows] = await db.query(query, params);

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
===================================================== */
exports.updateAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    const {
      title,
      description,
      max_marks,
      passing_marks,
      due_date,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE assignments SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        max_marks = COALESCE(?, max_marks),
        passing_marks = COALESCE(?, passing_marks),
        due_date = COALESCE(?, due_date),
        status = COALESCE(?, status)
       WHERE assignment_id = ?`,
      [
        title,
        description,
        max_marks,
        passing_marks,
        due_date,
        status,
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
      message: "Assignment updated successfully"
    });

  } catch (error) {
    console.error("Update Assignment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* =====================================================
   5️⃣ DELETE ASSIGNMENT FILE (DELETE)
===================================================== */
exports.deleteAssignmentFile = async (req, res) => {
  try {
    const { file_id } = req.params;

    const [result] = await db.query(
      `DELETE FROM assignment_files WHERE file_id = ?`,
      [file_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

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
===================================================== */
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    // delete files first (FK safe)
    await db.query(
      `DELETE FROM assignment_files WHERE assignment_id = ?`,
      [assignment_id]
    );

    const [result] = await db.query(
      `DELETE FROM assignments WHERE assignment_id = ?`,
      [assignment_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    res.json({
      success: true,
      message: "Assignment deleted successfully"
    });

  } catch (error) {
    console.error("Delete Assignment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
