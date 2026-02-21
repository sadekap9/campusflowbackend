require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function seedMarksData() {
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
        console.log("Seeding started...");

        // 1. Get Class & Section (Class 1, Section A)
        // 1. Get Class & Section (Fallback to any available)
        const [classes] = await pool.query("SELECT class_id FROM classes LIMIT 1");
        const class_id = classes[0]?.class_id;

        const [sections] = await pool.query("SELECT section_id FROM sections WHERE class_id = ? LIMIT 1", [class_id]);
        const section_id = sections[0]?.section_id;

        if (!class_id || !section_id) {
            console.error("Class 1 or Section A not found. Please ensure basic seed data exists.");
            return;
        }

        // 2. Get a Student in Class 1
        const [students] = await pool.query("SELECT student_id FROM student_profile WHERE class_id = ? AND section_id = ? LIMIT 1", [class_id, section_id]);
        let student_id = students[0]?.student_id;

        if (!student_id) {
            console.log("Creating dummy student...");
            const hashedPassword = await bcrypt.hash("password123", 10);
            const [newStudent] = await pool.query(`
                INSERT INTO student_profile (full_name, email, phone, enrollment_no, class_id, section_id, admission_date, password, status)
                VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, 'active')
            `, ["Demo Student", "demo@student.com", "9876543210", "DEMO001", class_id, section_id, hashedPassword]);
            student_id = newStudent.insertId;
        }

        // 3. Get Subjects (Math, English)
        const [subjects] = await pool.query("SELECT subject_id FROM subjects WHERE subject_name IN ('Mathematics', 'English')");
        const math_id = subjects[0]?.subject_id;
        const eng_id = subjects[1]?.subject_id;

        // 4. Create ONGOING Exam
        console.log("Creating ONGOING Exam...");
        const [ongoingExam] = await pool.query(`
            INSERT INTO exams (exam_type, academic_year, class_id, start_date, end_date, status)
            VALUES ('midterm', '2025-2026', ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'ongoing')
        `, [class_id]);
        const ongoing_exam_id = ongoingExam.insertId;

        // Add subjects to Ongoing Exam
        await pool.query(`
            INSERT INTO exam_subjects (exam_id, subject_id, max_marks, passing_marks, exam_date, start_time, end_time)
            VALUES 
            (?, ?, 100, 35, CURDATE(), '09:00:00', '12:00:00'), 
            (?, ?, 100, 35, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:00:00', '12:00:00')
        `, [ongoing_exam_id, math_id, ongoing_exam_id, eng_id]);

        // Add Marks for Ongoing Exam (Should be HIDDEN for student)
        await pool.query(`
            INSERT INTO marks (exam_id, exam_subject_id, student_id, class_id, section_id, subject_id, marks_obtained, percentage, grade, status)
            VALUES 
            (?, (SELECT exam_subject_id FROM exam_subjects WHERE exam_id=? AND subject_id=?), ?, ?, ?, ?, 85, 85, 'A', 'passed')
        `, [ongoing_exam_id, ongoing_exam_id, math_id, student_id, class_id, section_id, math_id]);


        // 5. Create COMPLETED Exam
        console.log("Creating COMPLETED Exam...");
        const [completedExam] = await pool.query(`
            INSERT INTO exams (exam_type, academic_year, class_id, start_date, end_date, status)
            VALUES ('unit_test', '2025-2026', ?, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'completed')
        `, [class_id]);
        const completed_exam_id = completedExam.insertId;

        // Add subjects to Completed Exam
        await pool.query(`
            INSERT INTO exam_subjects (exam_id, subject_id, max_marks, passing_marks, exam_date, start_time, end_time)
            VALUES 
            (?, ?, 50, 18, DATE_SUB(CURDATE(), INTERVAL 9 DAY), '09:00:00', '11:00:00'),
            (?, ?, 50, 18, DATE_SUB(CURDATE(), INTERVAL 8 DAY), '09:00:00', '11:00:00')
        `, [completed_exam_id, math_id, completed_exam_id, eng_id]);

        // Add Marks for Completed Exam (Should be VISIBLE to student)
        await pool.query(`
            INSERT INTO marks (exam_id, exam_subject_id, student_id, class_id, section_id, subject_id, marks_obtained, percentage, grade, status)
            VALUES 
            (?, (SELECT exam_subject_id FROM exam_subjects WHERE exam_id=? AND subject_id=?), ?, ?, ?, ?, 45, 90, 'A+', 'passed'),
            (?, (SELECT exam_subject_id FROM exam_subjects WHERE exam_id=? AND subject_id=?), ?, ?, ?, ?, 40, 80, 'A', 'passed')
        `, [completed_exam_id, completed_exam_id, math_id, student_id, class_id, section_id, math_id, completed_exam_id, completed_exam_id, eng_id, student_id, class_id, section_id, eng_id]);

        console.log("\n✅ Dummy Data Added Successfully!");
        console.log("------------------------------------------");
        console.log(`Student ID:      ${student_id}`);
        console.log(`Class ID:        ${class_id}`);
        console.log(`Section ID:      ${section_id}`);
        console.log(`Ongoing Exam ID: ${ongoing_exam_id} (Marks Hidden)`);
        console.log(`Completed Exam ID: ${completed_exam_id} (Marks Visible)`);
        console.log("------------------------------------------");

    } catch (err) {
        console.error("Seeding Error:", err);
    } finally {
        await pool.end();
    }
}

seedMarksData();
