require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testUpdateClash() {
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
    // 1. Find two slots in the same time
    console.log("Checking timetable entries...");
    const [rows] = await pool.query("SELECT timetable_id, teacher_id, day_of_week, start_time FROM timetable WHERE status = 'active' LIMIT 10");
    console.log("Current entries:", rows);

    if (rows.length < 2) {
        console.log("Not enough entries to test.");
        return;
    }

    // Try to update one entry to a teacher who is busy in another entry at the same time
    const slot1 = rows[0];
    const slot2 = rows.find(r => r.day_of_week === slot1.day_of_week && r.start_time === slot1.start_time && r.timetable_id !== slot1.timetable_id);

    if (!slot2) {
        console.log("No two entries in the same slot found.");
        return;
    }

    console.log(`Testing: Update timetable_id ${slot1.timetable_id} to teacher_id ${slot2.teacher_id} (who is busy at ${slot2.day_of_week} ${slot2.start_time} in timetable_id ${slot2.timetable_id})`);

    // Simulate UpdateTimetable logic
    const [[currentSlot]] = await pool.query(
      "SELECT day_of_week, start_time FROM timetable WHERE timetable_id = ?",
      [slot1.timetable_id]
    );
    const { day_of_week, start_time } = currentSlot;

    const [[clash]] = await pool.query(
      `SELECT timetable_id FROM timetable 
       WHERE teacher_id = ? 
       AND day_of_week = ? 
       AND start_time = ? 
       AND status = 'active'
       AND timetable_id != ?`,
      [slot2.teacher_id, day_of_week, start_time, slot1.timetable_id]
    );

    if (clash) {
        console.log("✅ SUCCESS: Clash detected correctly!", clash);
    } else {
        console.log("❌ FAILURE: Clash NOT detected!");
    }

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await pool.end();
  }
}

testUpdateClash();
