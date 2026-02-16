const db = require("../../../config/db");

exports.AddClasses = async (req, res) => {
    try {
        const { class_name } = req.body;
        if (!class_name) {
            return res.status(400).json({ message: "class_name required" });
        }
        const [existing] = await db.query(
            "SELECT class_id FROM classes WHERE class_name = ?",
            [class_name]
        );

        if (existing.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Class already exists",
                class_id: existing[0].class_id
            });
        }

        const [result] = await db.query("INSERT INTO classes (class_name) VALUES (?)", [class_name]);
        res.status(201).json({ message: "Class added successfully", class_id: result.insertId });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "server error" })
    }
}