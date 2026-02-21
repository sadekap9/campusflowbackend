
require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkStudentProfile() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    const [rows] = await connection.query("SELECT * FROM student_profile LIMIT 1");
    if (rows.length > 0) {
        console.log("Student Profile Columns:", Object.keys(rows[0]));
    } else {
        console.log("No students found");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    connection.end();
  }
}

checkStudentProfile();
