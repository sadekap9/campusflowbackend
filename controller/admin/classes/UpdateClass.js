const db = require("../../../config/db");

exports.UpdateClass = async (req, res) => {
  try {
    const { section_id } = req.params;   // from URL
    const { teacher_id } = req.body;     // from body

    // Validation
    if (!section_id || !teacher_id) {
      return res.status(400).json({
        message: "section_id and teacher_id are required"
      });
    }

    const [result] = await db.query(
      "UPDATE sections SET teacher_id = ? WHERE section_id = ?",
      [teacher_id, section_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Section not found"
      });
    }

    return res.status(200).json({
      message: "Teacher assigned to section successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.DeleteSection = async (req, res) => {
  try {
    const { section_id } = req.params;

    // Validation
    if (!section_id) {
      return res.status(400).json({
        message: "section_id is required"
      });
    }

    const [result] = await db.query(
      "DELETE FROM sections WHERE section_id = ?",
      [section_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Section not found"
      });
    }

    return res.status(200).json({
      message: "Section deleted successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};