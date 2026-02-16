require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkStudents() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            ca: fs.readFileSync(path.join(__dirname, 'config', 'ca.pem')),
            rejectUnauthorized: false
        }
    });

    const email = 'sadekap9@gmail.com';
    const loginPassword = 'Byxpek7R';
    const bcrypt = require('bcryptjs');

    try {
        const [rows] = await pool.query("SELECT student_id, email, password, status FROM student_profile WHERE email = ?", [email]);
        if (rows.length > 0) {
            const student = rows[0];
            const isMatch = await bcrypt.compare(loginPassword, student.password);
            console.log(`Student Found: ID ${student.student_id}, Email: ${student.email}`);
            console.log(`Status in DB: ${student.status}`);
            console.log(`Password Hash in DB: ${student.password}`);
            console.log(`Does 'Byxpek7R' match? ${isMatch}`);
        } else {
            console.log("No student found with that email.");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkStudents();
