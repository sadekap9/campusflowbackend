const db = require("../../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.Login = async (req, res) => {
 // console.log("api hit");
  
  const { email, password } = req.body;
  //console.log("Received login request:", email, password);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    
    
    const [rows] = await db.query(
      
      "SELECT admin_id, name, email, password, role, status FROM admin WHERE email = ?",
      [email]
    );
   // console.log(rows);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const admin = rows[0];

    // if (admin.status == 0) {
    //   return res.status(403).json({ message: "Admin account is inactive" });
    // }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        admin_id: admin.admin_id,
        role: admin.role,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        admin_id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
