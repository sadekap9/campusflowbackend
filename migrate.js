const db = require("./config/db");

async function migrate() {
  try {
    // Drop the existing table if it exists
    await db.query("DROP TABLE IF EXISTS student_profile");

    // Create the new table
    await db.query(`
      CREATE TABLE student_profile (
        student_id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(15) NOT NULL,
        mother_name VARCHAR(150),
        father_name VARCHAR(150),
        enrollment_no VARCHAR(50) UNIQUE,
        blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'),
        class_id INT NOT NULL,
        section_id INT NOT NULL,
        admission_date DATE NOT NULL,
        date_of_birth DATE,
        gender ENUM('male','female','other'),
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        guardian_name VARCHAR(100),
        guardian_phone VARCHAR(15),
        profile_image VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        status ENUM('active','inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(class_id),
        FOREIGN KEY (section_id) REFERENCES sections(section_id)
      )
    `);

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();