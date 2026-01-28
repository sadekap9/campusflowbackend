require("dotenv").config(); // MUST BE FIRST
const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const AdminRoute = require("./Routes/AdminRoute");
const TeacherRoute = require("./Routes/TeacherRoute");
const db = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/admin", AdminRoute);
app.use("/api/teacher", TeacherRoute);


// DB Test
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Database connected successfully!");
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
    
  }
})();


// Health
app.get("/", (req, res) => {
  res.send("🚀 Server is running and DB is connected!");
});

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
