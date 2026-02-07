const jwt = require("jsonwebtoken");
const { studentSessions } = require("../utils/sessions");

const authStudent = (req, res, next) => {
  try {
    // 1️⃣ Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify token integrity
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ ROLE CHECK
    if (decoded.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not a student."
      });
    }

    // 4️⃣ IDENTITY CHECK: If there is a student_id in params, it MUST match the token
    if (req.params.student_id && req.params.student_id != decoded.student_id) {
        return res.status(403).json({
            success: false,
            message: "Security violation: You cannot access data for another student."
        });
    }

    // 5️⃣ Add student info to request object
    req.student = decoded;
    next();
  } catch (error) {
    console.error("Auth Student Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token is not valid. Please login again."
    });
  }
};

module.exports = authStudent;
