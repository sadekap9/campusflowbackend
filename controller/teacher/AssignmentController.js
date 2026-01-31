const db = require("../../config/db");

/* =====================================================
   1️⃣ CREATE ASSIGNMENT (POST)
===================================================== */
exports.createAssignment = async (req, res) => {
  try {
    const {
      class_id,
      section_id,
      subject_id,
      teacher_id,
      title,
      description,
      max_marks,
      passing_marks,
      due_date
    } = req.body;

    if (!class_id || !section_id || !subject_id || !teacher_id || !title || !due_date) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

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
   2️⃣ UPLOAD ASSIGNMENT FILE (POST)
===================================================== */
exports.uploadAssignmentFiles = async (req, res) => {
  try {
    const { assignment_id } = req.params;
    
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
        a.*,
        af.file_id,
        af.file_path,
        af.file_type,
        af.uploaded_on
      FROM assignments a
      LEFT JOIN assignment_files af 
        ON a.assignment_id = af.assignment_id
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

    query += " ORDER BY a.created_at DESC";

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
