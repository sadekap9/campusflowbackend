require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
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
    console.log("🚀 Starting database cleanup and seeding...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 0. Cleanup existing data (Cascading through tables)
    console.log("Cleaning up old data...");
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    const tablesToClean = [
        'marks', 'assignment_marks', 'attendance_student', 'teacher_attendance',
        'assignment_submission', 'assignment_files', 'assignments', 'teacher_subject',
        'timetable', 'exam_subjects', 'exams', 'student_profile', 'class_subject',
        'sections', 'classes', 'teachers', 'subjects'
    ];
    for (const table of tablesToClean) {
        await pool.query(`TRUNCATE TABLE ${table}`);
    }
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    // 1. Classes (1st to 12th)
    console.log("Creating Classes (1st to 12th)...");
    const classNames = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
    for (const name of classNames) {
        await pool.query("INSERT INTO classes (class_name) VALUES (?)", [name]);
    }
    const [classes] = await pool.query("SELECT class_id, class_name FROM classes");

    // 2. Sections (A and B for each)
    console.log("Creating Sections (A and B for each class)...");
    for (const cls of classes) {
        await pool.query("INSERT INTO sections (class_id, section_name) VALUES (?, 'A'), (?, 'B')", [cls.class_id, cls.class_id]);
    }
    const [sections] = await pool.query("SELECT section_id, class_id FROM sections");

    // 3. Subjects (22 Subjects)
    console.log("Creating 22 Subjects...");
    const subjectNames = [
        "Mathematics", "Science", "English", "Physics", "Chemistry", "Biology", 
        "History", "Geography", "Computer Science", "Economics", "Civics", "Sanskrit", 
        "Hindi", "Physical Education", "Art", "Music", "Moral Science", "General Knowledge", 
        "Environment Science", "Business Studies", "Accountancy", "Sociology"
    ];
    for (const name of subjectNames) {
        await pool.query("INSERT INTO subjects (subject_name) VALUES (?)", [name]);
    }
    const [subjects] = await pool.query("SELECT subject_id, subject_name FROM subjects");

    // Realistic Names for Teachers and Students
    const maleNames = ["Arjun Sharma", "Rajesh Kumar", "Amit Singh", "Suresh Raina", "Vikram Rathore", "Sanjay Dutt", "Kapil Dev", "Sunil Gavaskar", "Virat Kohli", "Rohit Sharma", "Rahul Dravid", "MS Dhoni", "Sachin Tendulkar", "Anil Kumble", "Yuvraj Singh", "Gautam Gambhir", "Ishant Sharma", "Deepak Chahar", "Ravi Shastri", "Hardik Pandya"];
    const femaleNames = ["Priya Sharma", "Anjali Gupta", "Sunita Williams", "Meena Kumari", "Sneha Rao", "Pooja Hegde", "Deepika Padukone", "Priyanka Chopra", "Kareena Kapoor", "Alia Bhatt", "Shraddha Kapoor", "Anushka Sharma", "Kangana Ranaut", "Vidya Balan", "Rani Mukerji", "Parineeti Chopra", "Sonam Kapoor", "Jacqueline Fernandez", "Kriti Sanon", "Katrina Kaif"];

    // 4. Teachers (24 entries - one for each section A/B of 12 classes)
    console.log("Creating 24 Teachers...");
    const teachersData = [];
    for (let i = 0; i < 24; i++) {
        const isMale = i % 2 === 0;
        const nameList = isMale ? maleNames : femaleNames;
        const name = nameList[i % nameList.length];
        const teacher = [
            `EMP${1000 + i}`,
            name,
            isMale ? '1' : '2',
            `${name.toLowerCase().replace(/\s+/g, '.')}.${i}@campusflow.com`,
            `9876543${i.toString().padStart(3, '0')}`,
            'Post Graduate',
            5 + (i % 8),
            'Street ' + (i + 1) + ', South City',
            '2022-06-15',
            hashedPassword,
            '1' // active
        ];
        const [res] = await pool.query(
            "INSERT INTO teachers (emp_id, name, gender, email, phone, qualification, experience_year, address, joining_date, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            teacher
        );
        teachersData.push({ teacher_id: res.insertId, name: name });
    }

    // Assign Class Teachers to Sections (Unique assignment)
    console.log("Assigning Class Teachers to Sections...");
    for (let i = 0; i < sections.length; i++) {
        await pool.query("UPDATE sections SET teacher_id = ? WHERE section_id = ?", [teachersData[i].teacher_id, sections[i].section_id]);
    }

    // 5. Admin
    console.log("Ensuring Admin exists...");
    await pool.query("INSERT IGNORE INTO admin (name, email, password, role) VALUES ('System Administrator', 'admin@campusflow.com', ?, 1)", [hashedPassword]);

    // 6. Students (200 realistic entries divided across classes/sections)
    console.log("Creating 200 Students...");
    const studentRows = [];
    const cities = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur"];
    
    for (let i = 0; i < 200; i++) {
        const section = sections[i % sections.length]; // ~8-9 students per section (200/24)
        const isMale = i % 2 === 0;
        const firstName = isMale ? maleNames[Math.floor(Math.random() * maleNames.length)].split(' ')[0] : femaleNames[Math.floor(Math.random() * femaleNames.length)].split(' ')[0];
        const lastName = maleNames[Math.floor(Math.random() * maleNames.length)].split(' ')[1];
        const fullName = `${firstName} ${lastName}`;
        const fatherName = maleNames[Math.floor(Math.random() * maleNames.length)];
        const motherName = femaleNames[Math.floor(Math.random() * femaleNames.length)];
        const guardianName = (i % 3 === 0) ? fatherName : (i % 3 === 1 ? motherName : maleNames[Math.floor(Math.random() * maleNames.length)]);
        const address = `Flat No. ${100 + i}, ${cities[i % cities.length]} Residency`;
        
        const [res] = await pool.query(
            "INSERT INTO student_profile (full_name, mother_name, father_name, email, phone, enrollment_no, class_id, section_id, admission_date, date_of_birth, gender, password, status, address, city, state, pincode, guardian_name, guardian_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '1', ?, ?, 'Maharashtra', '400001', ?, ?)",
            [fullName, motherName, fatherName, `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@campusflow.com`, `9988776${i.toString().padStart(3, '0')}`, 'TEMP', section.class_id, section.section_id, '2024-06-01', '2012-08-20', isMale ? '1' : '2', hashedPassword, address, cities[i % cities.length], guardianName, `91827364${i.toString().padStart(2, '0')}`]
        );
        
        const enrollment_no = `ENR-${new Date().getFullYear()}-${res.insertId}`;
        await pool.query("UPDATE student_profile SET enrollment_no = ? WHERE student_id = ?", [enrollment_no, res.insertId]);
        
        studentRows.push({ student_id: res.insertId, class_id: section.class_id, section_id: section.section_id });
    }

    // 7. Teacher Subject Mapping (Assigning 7 subjects per class)
    console.log("Mapping Teachers to Subjects (7 subjects per class)...");
    for (const cls of classes) {
        for (let j = 0; j < 7; j++) {
            const subjectIdx = (cls.class_id + j) % subjects.length;
            const teacherIdx = (cls.class_id + j) % teachersData.length;
            
            await pool.query(
                "INSERT IGNORE INTO teacher_subject (teacher_id, class_id, subject_id, status) VALUES (?, ?, ?, 'active')",
                [teachersData[teacherIdx].teacher_id, cls.class_id, subjects[subjectIdx].subject_id]
            );
        }
    }

    // 8. Exams
    console.log("Creating Exams...");
    for (const cls of classes.slice(0, 5)) {
        const [res] = await pool.query(
            "INSERT INTO exams (exam_type, academic_year, class_id, start_date, end_date, status) VALUES ('midterm', '2024-25', ?, '2024-10-01', '2024-10-15', 'completed')",
            [cls.class_id]
        );
        const exam_id = res.insertId;

        // Exam Subjects
        for (let j = 0; j < 3; j++) {
            const subject = subjects[j];
            const [esRes] = await pool.query(
                "INSERT INTO exam_subjects (exam_id, subject_id, max_marks, passing_marks, exam_date, start_time, end_time) VALUES (?, ?, 100, 40, '2024-10-05', '10:00:00', '13:00:00')",
                [exam_id, subject.subject_id]
            );
            const exam_subject_id = esRes.insertId;

            // Seed Marks for this subject
            const matchingStudents = studentRows.filter(s => s.class_id === cls.class_id);
            for (const student of matchingStudents) {
                const marksObtained = Math.floor(Math.random() * 60) + 40;
                await pool.query(
                    `INSERT INTO marks (exam_id, exam_subject_id, student_id, class_id, section_id, subject_id, marks_obtained, percentage, grade, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [exam_id, exam_subject_id, student.student_id, student.class_id, student.section_id, subject.subject_id, marksObtained, marksObtained, marksObtained >= 90 ? 'A+' : 'B', marksObtained >= 40 ? 'passed' : 'failed']
                );
            }
        }
    }

    // 9. Attendance
    console.log("Seeding Attendance...");
    const today = new Date().toISOString().split('T')[0];
    for (const student of studentRows.slice(0, 20)) {
        await pool.query(
            "INSERT INTO attendance_student (student_id, class_id, section_id, attendance_date, status) VALUES (?, ?, ?, ?, 'present')",
            [student.student_id, student.class_id, student.section_id, today]
        );
    }

    // 14. Timetable
    console.log("Seeding Conflict-Free Timetable (Monday to Saturday)...");
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const lessonTimes = ['09:00:00', '10:00:00', '11:00:00', '12:00:00', '13:00:00', '14:00:00'];
    
    // Get the teacher-subject mapping
    const [mappings] = await pool.query("SELECT teacher_id, class_id, subject_id FROM teacher_subject");

    // Track busy teachers: busyTeachers[day][time] = Set of teacher_ids
    const busyTeachers = {};
    days.forEach(day => {
        busyTeachers[day] = {};
        lessonTimes.forEach(time => {
            busyTeachers[day][time] = new Set();
        });
    });

    for (const day of days) {
        for (const time of lessonTimes) {
            // To ensure different timetables, we can shuffle or offset the sections
            // But the most important part is the teacher conflict check
            for (const section of sections) {
                // Filter mappings for this specific class
                const classMappings = mappings.filter(m => m.class_id === section.class_id);
                
                // Find an available teacher for this slot from the class mappings
                // Randomly shuffle classMappings to ensure variety between sections
                const shuffledMappings = classMappings.sort(() => Math.random() - 0.5);
                
                const validMapping = shuffledMappings.find(m => !busyTeachers[day][time].has(m.teacher_id));

                if (validMapping) {
                    await pool.query(
                        "INSERT IGNORE INTO timetable (class_id, section_id, day_of_week, start_time, subject_id, teacher_id, academic_year, status) VALUES (?, ?, ?, ?, ?, ?, '2024-25', 'active')",
                        [section.class_id, section.section_id, day, time, validMapping.subject_id, validMapping.teacher_id]
                    );
                    busyTeachers[day][time].add(validMapping.teacher_id);
                } else {
                    // Fallback: If no assigned subject teacher is free, just skip or log
                    // In a real scenario, we might need more teachers or a break
                    // console.warn(`No free teacher found for Class ${section.class_id} Section ${section.section_id} on ${day} at ${time}`);
                }
            }
        }
    }

    console.log("✅ Comprehensive seeding with valid Timetable completed successfully!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await pool.end();
  }
}

seedDatabase();
