const jwt = require("jsonwebtoken");

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

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Check if role is teacher
    if (decoded.role !== "teacher") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not a teacher."
      });
    }

    // 4️⃣ Add teacher info to request object
    req.teacher = decoded;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token is not valid"
    });
  }
};

module.exports = authTeacher;
