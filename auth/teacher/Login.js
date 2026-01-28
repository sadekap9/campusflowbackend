const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateRandomPassword, hashPassword } = require("../../utils/password");
const { sendForgotPasswordEmail } = require("../../config/mailer");

exports.TeacherLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email and password are required" 
    });
  }

  try {
    // 1️⃣ Find teacher by email
    const [rows] = await db.query(
      "SELECT teacher_id, name, email, password, emp_id, status FROM teachers WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const teacher = rows[0];

    // 2️⃣ Check if teacher is active
    if (teacher.status != '1' && teacher.status != 'active') {
        return res.status(403).json({ 
            success: false, 
            message: "Teacher account is inactive. Please contact administrator." 
        });
    }

    // 3️⃣ Verify password
    const isMatch = await bcrypt.compare(password, teacher.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // 4️⃣ Generate JWT Token
    const token = jwt.sign(
      {
        teacher_id: teacher.teacher_id,
        emp_id: teacher.emp_id,
        email: teacher.email,
        role: "teacher",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5️⃣ Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      teacher: {
        teacher_id: teacher.teacher_id,
        emp_id: teacher.emp_id,
        name: teacher.name,
        email: teacher.email,
        role: "teacher"
      },
    });

  } catch (error) {
    console.error("Teacher Login Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
exports.ForgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required"
    });
  }

  try {
    // 1️⃣ Check if teacher exists
    const [rows] = await db.query(
      "SELECT teacher_id FROM teachers WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found with this email"
      });
    }

    // 2️⃣ Generate new random password
    const newPlainPassword = generateRandomPassword();
    const newHashedPassword = await hashPassword(newPlainPassword);

    // 3️⃣ Update password in DB
    await db.query(
      "UPDATE teachers SET password = ? WHERE email = ?",
      [newHashedPassword, email]
    );

    // 4️⃣ Send email with new password
    await sendForgotPasswordEmail(email, newPlainPassword);

    res.status(200).json({
      success: true,
      message: "New password has been sent to your email"
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
