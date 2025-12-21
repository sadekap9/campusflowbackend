-- =========================
-- ADMIN
-- =========================
CREATE TABLE admin (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
 email VARCHAR(100) NOT NULL UNIQUE,
 password VARCHAR(255) NOT NULL,
 role int 
       DEFAULT 1,
 status int DEFAULT 'active',
 created_at TIMESTAMP 
             DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_profile (
  student_id INT NOT NULL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  mother_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150) NOT NULL,
  enrollment_no VARCHAR(50) NOT NULL UNIQUE,
 blood_group ENUM(
    'A+','A-','B+','B-','AB+','AB-','O+','O-'
  ) DEFAULT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  admission_date DATE NOT NULL,
  date_of_birth DATE DEFAULT NULL,
  gender ENUM('male','female','other') DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state VARCHAR(100) DEFAULT NULL,
  pincode VARCHAR(10) DEFAULT NULL,
  guardian_name VARCHAR(100) DEFAULT NULL,
  guardian_phone VARCHAR(15) DEFAULT NULL,

  profile_image VARCHAR(255) DEFAULT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) 

-- =========================
-- CLASSES
-- =========================
CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SECTIONS
-- =========================
CREATE TABLE sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    UNIQUE (class_id, section_name)
);

-- =========================
-- STUDENT PROFILE
-- =========================
CREATE TABLE student_profile (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    enrollment_no VARCHAR(50) NOT NULL UNIQUE,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    admission_date DATE NOT NULL,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(15),
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

-- =========================
-- SUBJECTS
-- =========================
CREATE TABLE subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- CLASS SUBJECT
-- =========================
CREATE TABLE class_subject (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE CASCADE,
    UNIQUE (class_id, section_id, subject_id)
);

-- =========================
-- TEACHERS
-- =========================
CREATE TABLE teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'other'),
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15),
    qualification VARCHAR(100),
    experience_year INT DEFAULT 0,
    address VARCHAR(255),
    joining_date DATE NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TEACHER SUBJECT
-- =========================
CREATE TABLE teacher_subject (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_type ENUM('primary', 'co-teacher') DEFAULT 'primary',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (created_by) REFERENCES admin(admin_id),
    UNIQUE (teacher_id, class_id, section_id, subject_id)
);

-- =========================
-- ATTENDANCE
-- =========================
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('present', 'absent') NOT NULL,
    marked_by INT NULL,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    UNIQUE (student_id, attendance_date)
);

-- =========================
-- ASSIGNMENTS
-- =========================
CREATE TABLE assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_marks DECIMAL(5,2) NOT NULL,
    passing_marks DECIMAL(5,2),
    due_date DATE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

-- =========================
-- ASSIGNMENT SUBMISSION
-- =========================
CREATE TABLE assignment_submission (
    submission_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_late ENUM('LATE', 'ONTIME') DEFAULT 'ONTIME',
    remarks VARCHAR(255),
    status ENUM('submitted', 'late', 'not_submitted') DEFAULT 'submitted',
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE (assignment_id, student_id)
);

-- =========================
-- ASSIGNMENT FILES
-- =========================
CREATE TABLE assignment_files (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(20),
    uploaded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(assignment_id) ON DELETE CASCADE
);

-- =========================
-- ASSIGNMENT SUBMISSION FILES
-- =========================
CREATE TABLE assignment_submission_files (
    submission_file_id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(20),
    uploaded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES assignment_submission(submission_id) ON DELETE CASCADE
);

-- =========================
-- EXAMS
-- =========================
CREATE TABLE exams (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_type ENUM('unit_test', 'midterm', 'final', 'practical', 'other') NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    class_id INT NOT NULL,
    section_id INT NULL,
    start_date DATE,
    end_date DATE,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

-- =========================
-- EXAM SUBJECTS
-- =========================
CREATE TABLE exam_subjects (
    exam_subject_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    subject_id INT NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    passing_marks DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);

-- =========================
-- MARKS
-- =========================
CREATE TABLE marks (
    mark_id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    exam_subject_id INT NOT NULL,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    subject_id INT NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2),
    grade VARCHAR(5),
    status ENUM('passed', 'failed'),
    evaluated_by INT NULL,
    remarks VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(exam_id),
    FOREIGN KEY (exam_subject_id) REFERENCES exam_subjects(exam_subject_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id),
    FOREIGN KEY (evaluated_by) REFERENCES teachers(teacher_id) ON DELETE SET NULL
);

-- =========================
-- PERIODS
-- =========================
CREATE TABLE periods (
    period_id INT AUTO_INCREMENT PRIMARY KEY,
    period_name VARCHAR(50) NOT NULL,
    period_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_break TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- TIMETABLE
-- =========================
CREATE TABLE timetable (
    timetable_id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') NOT NULL,
    period_id INT NOT NULL,
    subject_id INT NULL,
    teacher_id INT NULL,
    room_no VARCHAR(20),
    academic_year VARCHAR(9) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id),
    FOREIGN KEY (period_id) REFERENCES periods(period_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE SET NULL
);
