const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateRandomPassword, hashPassword } = require("../../utils/password");
const { sendForgotPasswordEmail } = require("../../config/mailer");
const { studentSessions } = require("../../utils/sessions");

exports.StudentLogin = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ 
      success: false, 
      message: "Request body is missing" 
    });
  }
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Email and password are required" 
    });
  }

  try {
    // 1️⃣ Find student by email
    const [rows] = await db.query(
      "SELECT student_id, full_name, email, password, enrollment_no, status FROM student_profile WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    const student = rows[0];

    // 2️⃣ Check if student is active
    if (student.status !== 'active' && student.status !== '1') {
        return res.status(403).json({ 
            success: false, 
            message: "Student account is inactive. Please contact administrator." 
        });
    }

    // 3️⃣ Verify password
    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // 4️⃣ Generate JWT Token
    const token = jwt.sign(
      {
        student_id: student.student_id,
        enrollment_no: student.enrollment_no,
        email: student.email,
        role: "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5️⃣ Store this as the ONLY active session for this student
    studentSessions.set(student.student_id.toString(), token);

    // 6️⃣ Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      student: {
        student_id: student.student_id,
        enrollment_no: student.enrollment_no,
        full_name: student.full_name,
        email: student.email,
        role: "student"
      },
    });

  } catch (error) {
    console.error("Student Login Error:", error);
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
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    // 1️⃣ Check if student exists AND is active in the database
    const [[student]] = await db.query(
      "SELECT student_id, email, status FROM student_profile WHERE email = ?",
      [email]
    );
    if (!student) {
        console.log("Student not found");
      return res.status(404).json({
        success: false
        
      });
    }
    // 2️⃣ Only allow reset for active accounts
    if (student.status !== 'active' && student.status !== '1') {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Cannot reset password."
      });
    }
    // 3️⃣ Generate new secure random password
    const newPlainPassword = generateRandomPassword();
    const newHashedPassword = await hashPassword(newPlainPassword);
    
    // 4️⃣ Update password in DB
    await db.query(
      "UPDATE student_profile SET password = ? WHERE student_id = ?",
      [newHashedPassword, student.student_id]
    );
    
    // 5️⃣ Send email
    await sendForgotPasswordEmail(student.email, newPlainPassword);
    
    res.status(200).json({
      success: true,
      message: "A new password has been sent to your registered email address"
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
