
require("dotenv").config();
const mysql = require("mysql2/promise");

async function checkExams() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  console.log("Connected to DB");

  try {
    const [exams] = await connection.query("SELECT * FROM exams");
    console.log("Exams:", exams);

    const [classes] = await connection.query("SELECT * FROM classes");
    console.log("Classes:", classes);

    // perform the join query used in GetAllExams
    const [joinedExams] = await connection.query(`
      SELECT e.*, c.class_name 
      FROM exams e
      JOIN classes c ON e.class_id = c.class_id
    `);
    console.log("Joined Exams:", joinedExams);
    
  } catch (err) {
    console.error("Error:", err);
  } finally {
    connection.end();
  }
}

checkExams();
