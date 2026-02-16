require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkTeachers() {
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

    try {
        const [rows] = await pool.query("SELECT teacher_id, name, email, password, status FROM teachers");
        console.log("Teachers in DB:");
        rows.forEach(row => {
            console.log(`ID: ${row.teacher_id}, Name: ${row.name}, Email: ${row.email}`);
        });
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

checkTeachers();
