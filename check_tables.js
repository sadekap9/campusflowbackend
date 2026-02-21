require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkTables() {
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
        const [marks] = await pool.query('DESCRIBE marks');
        console.log('--- MARKS TABLE ---');
        console.log(marks.map(f => `${f.Field} (${f.Type})`).join('\n'));

        console.log('\n--- CHECKING STUDENTS TABLE ---');
        try {
            const [students] = await pool.query('DESCRIBE students');
            console.log('Students table found!');
            console.log(students.map(f => `${f.Field} (${f.Type})`).join('\n'));
        } catch (e) {
            console.log('Students table NOT found. Checking student_profile...');
            const [profiles] = await pool.query('DESCRIBE student_profile');
            console.log('Student_profile table found!');
            console.log(profiles.map(f => `${f.Field} (${f.Type})`).join('\n'));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
checkTables();
