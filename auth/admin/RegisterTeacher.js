const db = require("../../config/db");
const { generateRandomPassword, hashPassword } = require("../../utils/password");
const { sendTeacherCredentials } = require("../../config/mailer");

exports.registerTeacher = async (req, res) => {
    
  try {
    const {
      name,
      email,
      phone,
      gender,
      qualification,
      experience_year,
      address,
      joining_date,
    } = req.body;

    if (!name || !email || !phone || !joining_date) {
      return res.status(400).json({ message: "Required fields missing" });
    }
// Auto-generate password
const plainPassword = generateRandomPassword();

// Hash generated password
const hashedPassword = await hashPassword(plainPassword);

    const profile_image = req.file ? req.file.path : null;

    // 1️⃣ Insert teacher without emp_id
    const [result] = await db.query(
      `INSERT INTO teachers (
        name, email, phone, gender,
        qualification, experience_year, address,
        joining_date,password, profile_image
      ) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        name,
        email,
        phone,
        gender,
        qualification,
        experience_year,
        address,
        joining_date,
        hashedPassword,
        profile_image
      ]
    );

    // 2️⃣ Generate emp_id using inserted ID
    const year = new Date().getFullYear();
    const emp_id = `EMP-${year}-${String(result.insertId).padStart(4, "0")}`;

    // 3️⃣ Update emp_id
    await db.query(
      `UPDATE teachers SET emp_id = ? WHERE teacher_id = ?`,
      [emp_id, result.insertId]
    );
    await sendTeacherCredentials(email, plainPassword, emp_id);


    res.status(201).json({
      message: "Teacher registered successfully",
      emp_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
