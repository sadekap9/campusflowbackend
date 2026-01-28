const jwt = require("jsonwebtoken");
const { teacherSessions } = require("../utils/sessions");

const authTeacher = (req, res, next) => {
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

    // 3️⃣ SESSION CHECK: Is this the latest token for this teacher?
    const validToken = teacherSessions.get(decoded.teacher_id.toString());
    
    if (!validToken || validToken !== token) {
        return res.status(401).json({
            success: false,
            message: "Your session has expired or you logged in from another device. Please login again."
        });
    }

    // 4️⃣ ROLE CHECK
    if (decoded.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not a teacher."
      });
    }

    // 5️⃣ IDENTITY CHECK: If there is a teacher_id in params, it MUST match the token
    if (req.params.teacher_id && req.params.teacher_id != decoded.teacher_id) {
        return res.status(403).json({
            success: false,
            message: "Security violation: You cannot access data for another teacher."
        });
    }

    // 6️⃣ Add teacher info to request object
    req.teacher = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token is not valid. Please login again."
    });
  }
};

module.exports = authTeacher;
