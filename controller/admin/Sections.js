// controllers/admin/sectionController.js
const db = require("../../config/db");

exports.AddSection = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { section_name,teacher_id } = req.body;

    /* =====================
       1️⃣ Validation
    ===================== */
    if (!class_id || !section_name) {
      return res.status(400).json({
        success: false,
        message: "class_id and section_name are required"
      });
    }

    /* =====================
       2️⃣ Check duplicate (class_id + section_name)
       Example: Class 3 + Section A already exists
    ===================== */
    const [existing] = await db.query(
      `SELECT section_id 
       FROM sections 
       WHERE class_id = ? AND section_name = ?`,
      [class_id, section_name]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Section '${section_name}' already exists for this class`
      });
    }

    /* =====================
       3️⃣ Insert section
    ===================== */
    await db.query(
      `INSERT INTO sections 
       (class_id, section_name, teacher_id)
       VALUES (?, ?, ?)`,
      [
        class_id,
        section_name,
        teacher_id || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Section added successfully"
    });

  } catch (error) {
    console.error(error);

    /* =====================
       4️⃣ Foreign key error (teacher_id)
    ===================== */
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher selected"
      });
    }

    /* =====================
       5️⃣ Duplicate from DB constraint (backup safety)
    ===================== */
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Section already exists for this class"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
