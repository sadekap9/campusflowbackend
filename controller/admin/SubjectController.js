const db = require("../../config/db");

/* ===================== ADD SUBJECT ===================== */
exports.addSubject = async (req, res) => {
  try {
    const { subject_name, subject_code, subject_description } = req.body;

    if (!subject_name || !subject_code) {
      return res.status(400).json({
        success: false,
        message: "subject_name and subject_code are required"
      });
    }

    // Check duplicate subject_code
    const [exists] = await db.query(
      "SELECT subject_id FROM subjects WHERE subject_code = ?",
      [subject_code]
    );

    if (exists.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
        subject_id: exists[0].subject_id
      });
    }

    const [result] = await db.query(
      `INSERT INTO subjects 
       (subject_name, subject_code, subject_description)
       VALUES (?, ?, ?)`,
      [subject_name, subject_code, subject_description]
    );

    res.status(201).json({
      success: true,
      message: "Subject added successfully",
      subject_id: result.insertId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ===================== UPDATE SUBJECT ===================== */
exports.updateSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;
    const {
      subject_name,
      subject_code,
      subject_description,
      status
    } = req.body;

    if (!subject_id) {
      return res.status(400).json({ success: false, message: "subject_id required" });
    }

    const [result] = await db.query(
      `UPDATE subjects SET
        subject_name = COALESCE(?, subject_name),
        subject_code = COALESCE(?, subject_code),
        subject_description = COALESCE(?, subject_description),
        status = COALESCE(?, status)
      WHERE subject_id = ?`,
      [
        subject_name || null,
        subject_code || null,
        subject_description || null,
        status || null,
        subject_id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }
    
    res.json(
        {
        success: true,
        message: "Subject updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


/* ===================== DELETE SUBJECT (SOFT DELETE) ===================== */
exports.deleteSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;

    const [result] = await db.query(
      "UPDATE subjects SET status = 'inactive' WHERE subject_id = ?",
      [subject_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.json(
       { success: true,
        message: "Subject deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===================== LIST SUBJECTS ===================== */
exports.listSubjects = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM subjects ORDER BY created_at DESC"
    );

    res.status(200).json({
      success: true,
      total: rows.length,
      subjects: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ===================== GET SINGLE SUBJECT ===================== */
exports.getSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;
    const [rows] = await db.query(
      "SELECT * FROM subjects WHERE subject_id = ?",
      [subject_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.status(200).json({
      success: true,
      subject: rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
