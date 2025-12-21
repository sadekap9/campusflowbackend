const db = require("../../config/db");

exports.AddSection = async (req, res) => {
  try {
    console.log("api hit");
    
    const section_name = req.body.section_name;
    const class_id = req.params.class_id; // 👈 from URL

    if (!section_name) {
      return res.status(400).json({ message: "section_name required" });
    }

    await db.query(
      "INSERT INTO sections (section_name, class_id) VALUES (?, ?)",
      [section_name, class_id]
    );

    return res.json({ message: "Section added" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
