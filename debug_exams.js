require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
    try {
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

        console.log("--- Fetching Exams ---");
        const [exams] = await pool.query(`
            SELECT e.exam_id, e.exam_type, e.class_id, c.class_name, e.status 
            FROM exams e 
            LEFT JOIN classes c ON e.class_id = c.class_id
        `);
        console.table(exams);

        console.log("\n--- Fetching Classes ---");
        const [classes] = await pool.query("SELECT * FROM classes");
        console.table(classes);

        await pool.end();
    } catch (err) {
        console.error("Error:", err);
    }
})();
