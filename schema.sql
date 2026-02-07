CREATE TABLE admin (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role INT DEFAULT 1,
  status INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignment_files (
  file_id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(255) DEFAULT NULL,
  uploaded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignment_marks (
  mark_id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  teacher_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  remarks VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_locked TINYINT DEFAULT 0
);

CREATE TABLE assignment_submission (
  submission_id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submitted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_late ENUM('LATE', 'ONTIME') NOT NULL DEFAULT 'ONTIME',
  remarks VARCHAR(255) DEFAULT NULL,
  status ENUM('submitted', 'late', 'not_submitted') DEFAULT 'submitted',
  file_path VARCHAR(255) DEFAULT NULL,
  file_type VARCHAR(255) DEFAULT NULL
);

CREATE TABLE assignments (
  assignment_id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  passing_marks DECIMAL(5,2) DEFAULT NULL,
  due_date DATE NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance_student (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present', 'absent') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_subject (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  section_id INT NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE classes (
  class_id INT AUTO_INCREMENT PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_income (
  event_income_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  income_source VARCHAR(100) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  received_date DATE NOT NULL,
  remarks VARCHAR(255) DEFAULT NULL
);

CREATE TABLE event_participants (
  participant_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  participant_type ENUM('teacher', 'class') NOT NULL,
  teacher_id INT DEFAULT NULL,
  class_id INT DEFAULT NULL,
  role VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_types (
  event_type_id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  status INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  event_type_id INT NOT NULL,
  event_title VARCHAR(150) NOT NULL,
  description TEXT DEFAULT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME DEFAULT NULL,
  end_time TIME DEFAULT NULL,
  location VARCHAR(150) DEFAULT NULL,
  organized_by VARCHAR(100) DEFAULT NULL,
  status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_subjects (
  exam_subject_id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  subject_id INT NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  passing_marks DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled'
);

CREATE TABLE exams (
  exam_id INT AUTO_INCREMENT PRIMARY KEY,
  exam_type ENUM('unit_test', 'midterm', 'final', 'practical', 'other') NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  class_id INT NOT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense_categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT NULL,
  status INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  description VARCHAR(255) DEFAULT NULL
);

CREATE TABLE marks (
  mark_id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  exam_subject_id INT NOT NULL,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  subject_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  percentage DECIMAL(5,2) DEFAULT NULL,
  grade VARCHAR(5) DEFAULT NULL,
  status ENUM('passed', 'failed') DEFAULT NULL,
  evaluated_by INT DEFAULT NULL,
  remarks VARCHAR(255) DEFAULT NULL,
  is_locked TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_student_exam_subject (exam_id, exam_subject_id, student_id)
);

CREATE TABLE salary_structures (
  salary_structure_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_type ENUM('pre_primary', 'primary', 'secondary', 'higher_secondary') NOT NULL UNIQUE,
  basic_salary DECIMAL(10,2) NOT NULL,
  hra DECIMAL(10,2) DEFAULT 0.00,
  da DECIMAL(10,2) DEFAULT 0.00,
  other_allowance DECIMAL(10,2) DEFAULT 0.00,
  pf_percentage DECIMAL(5,2) DEFAULT 0.00,
  tax_percentage DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sections (
  section_id INT AUTO_INCREMENT PRIMARY KEY,
  section_name VARCHAR(50) NOT NULL,
  class_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  teacher_id INT DEFAULT NULL
);

CREATE TABLE student_profile (
  student_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  mother_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150) NOT NULL,
  enrollment_no VARCHAR(50) UNIQUE DEFAULT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  admission_date DATE NOT NULL,
  date_of_birth DATE DEFAULT NULL,
  gender ENUM('1','2','3') DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state VARCHAR(100) DEFAULT NULL,
  pincode VARCHAR(10) DEFAULT NULL,
  guardian_name VARCHAR(100) DEFAULT NULL,
  guardian_phone VARCHAR(15) DEFAULT NULL,
  profile_image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password VARCHAR(100) DEFAULT NULL,
  status VARCHAR(45) DEFAULT '1'
);

CREATE TABLE subjects (
  subject_id INT AUTO_INCREMENT PRIMARY KEY,
  subject_name VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  subject_description VARCHAR(255) DEFAULT NULL,
  subject_code VARCHAR(25) DEFAULT NULL
);

CREATE TABLE teacher_attendance (
  attendance_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('present', 'absent') NOT NULL,
  log_in TIME DEFAULT NULL,
  log_out TIME DEFAULT NULL
);

CREATE TABLE teacher_bank_details (
  bank_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  account_holder_name VARCHAR(100) NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  branch_name VARCHAR(100) DEFAULT NULL,
  account_number VARCHAR(30) NOT NULL,
  ifsc_code VARCHAR(15) NOT NULL,
  account_type ENUM('savings', 'current') DEFAULT 'savings',
  upi_id VARCHAR(50) DEFAULT NULL,
  status INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teacher_leave_policy (
  policy_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_type ENUM('pre_primary', 'primary', 'secondary', 'higher_secondary') NOT NULL,
  monthly_paid_leaves INT DEFAULT 1,
  yearly_paid_leaves INT DEFAULT 12
);

CREATE TABLE teacher_salary (
  teacher_salary_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  salary_month INT NOT NULL,
  salary_year INT NOT NULL,
  basic_salary DECIMAL(10,2) DEFAULT NULL,
  hra DECIMAL(10,2) DEFAULT NULL,
  da DECIMAL(10,2) DEFAULT NULL,
  other_allowance DECIMAL(10,2) DEFAULT NULL,
  gross_salary DECIMAL(10,2) DEFAULT NULL,
  leave_days INT DEFAULT 0,
  half_day_count INT DEFAULT 0,
  per_day_salary DECIMAL(10,2) DEFAULT NULL,
  leave_deduction DECIMAL(10,2) DEFAULT NULL,
  pf_amount DECIMAL(10,2) DEFAULT NULL,
  tax_amount DECIMAL(10,2) DEFAULT NULL,
  net_salary DECIMAL(10,2) DEFAULT NULL,
  status ENUM('generated', 'paid', 'cancelled') DEFAULT 'generated',
  is_locked TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teacher_salary_payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_salary_id INT NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode ENUM('cash', 'bank', 'upi', 'other') NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT NULL,
  remarks VARCHAR(255) DEFAULT NULL
);

CREATE TABLE teacher_subject (
  teacher_subject_id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teachers (
  teacher_id INT AUTO_INCREMENT PRIMARY KEY,
  emp_id VARCHAR(50) UNIQUE DEFAULT NULL,
  name VARCHAR(100) NOT NULL,
  gender ENUM('1', '2', '3') DEFAULT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(15) DEFAULT NULL,
  qualification VARCHAR(100) DEFAULT NULL,
  experience_year INT DEFAULT 0,
  address VARCHAR(255) DEFAULT NULL,
  joining_date DATE NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('1', '0') NOT NULL DEFAULT '1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  profile_image VARCHAR(500) DEFAULT NULL,
  teacher_type ENUM('pre_primary', 'primary', 'secondary', 'higher_secondary') NOT NULL
);

CREATE TABLE timetable (
  timetable_id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  section_id INT NOT NULL,
  day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
  subject_id INT DEFAULT NULL,
  teacher_id INT DEFAULT NULL,
  academic_year VARCHAR(9) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  proxy_teacher_id INT DEFAULT NULL,
  proxy_date DATE DEFAULT NULL,
  start_time TIME DEFAULT NULL
);