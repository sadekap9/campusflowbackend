
require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkMarksTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    const [marks] = await connection.query("SELECT * FROM marks LIMIT 5");
    console.log("Marks Sample:", marks);
    
    // Check if any mark exists for exam_id 8 (which we saw earlier)
    const [specificMarks] = await connection.query("SELECT * FROM marks WHERE exam_id = 8");
    console.log("Marks for Exam 8:", specificMarks);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    connection.end();
  }
}

checkMarksTable();
