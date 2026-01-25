const db = require("../../config/db");
const { generateRandomPassword, hashPassword } = require("../../utils/password");
const {sendStudentCredentials } = require("../../config/mailer")
exports.registerStudentProfile = async (req, res) => {
 
  try {
    console.log(req.body);
    
    const {
      full_name,
      mother_name,
      father_name,
      blood_group,
      class_id,
      section_id,
      admission_date,
      date_of_birth,
      gender,
      address,
      city,
      state,
      pincode,
      guardian_name,
      guardian_phone,email,mobile_number
    } = req.body;

    // Required fields validation
    if (!full_name || !class_id || !section_id || !admission_date || !email) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Check if email already exists
    const [existingStudent] = await db.query(
      "SELECT student_id FROM student_profile WHERE email = ?",
      [email]
    );

    if (existingStudent.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const plainPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(plainPassword);

    // Cloudinary image URL
    const profile_image = req.file ? req.file.path : null;

    const [result] = await db.query(
      `INSERT INTO student_profile (
        full_name,email,phone ,mother_name, father_name,
       blood_group, class_id, section_id,
        admission_date, date_of_birth, gender,
        address, city, state, pincode,
        guardian_name, guardian_phone, profile_image,password
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        full_name,email,mobile_number,mother_name, father_name,
         blood_group, class_id, section_id,
        admission_date, date_of_birth, gender,
        address, city, state, pincode,
        guardian_name, guardian_phone, profile_image,hashedPassword
      ]
    );
 const enrollment_no = `ENR-${new Date().getFullYear()}-${result.insertId}`;

    await db.query(
      "UPDATE student_profile SET enrollment_no = ? WHERE student_id = ?",
      [enrollment_no, result.insertId]
    );
    await sendStudentCredentials(email,plainPassword,enrollment_no)
    res.status(201).json({
      message: "Student profile registered successfully",
      student_id: result.insertId,
      profile_image
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};


exports.updateStudentProfile = async (req, res) => {
  try {
    const { student_id } = req.params;

    // SAFE destructuring (prevents req.body undefined crash)
    const body = req.body || {};

    const {
      full_name,
      email,
      mobile_number,
      mother_name,
      father_name,
      blood_group,
      class_id,
      section_id,
      admission_date,
      date_of_birth,
      gender,
      address,
      city,
      state,
      pincode,
      guardian_name,
      guardian_phone,
      status
    } = body;

    // Check student exists
    const [existing] = await db.query(
      "SELECT profile_image, email FROM student_profile WHERE student_id = ?",
      [student_id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Email uniqueness check (if email is being changed)
    if (email && email !== existing[0].email) {
      const [emailCheck] = await db.query(
        "SELECT student_id FROM student_profile WHERE email = ? AND student_id != ?",
        [email, student_id]
      );
      if (emailCheck.length > 0) {
        return res.status(400).json({ message: "Email already in use by another student" });
      }
    }

    // Handle profile image update
    const profile_image = req.file
      ? req.file.path
      : existing[0].profile_image;

    // Update student profile
    await db.query(
      `UPDATE student_profile SET
        full_name = ?,
        email = ?,
        phone = ?,
        mother_name = ?,
        father_name = ?,
        blood_group = ?,
        class_id = ?,
        section_id = ?,
        admission_date = ?,
        date_of_birth = ?,
        gender = ?,
        address = ?,
        city = ?,
        state = ?,
        pincode = ?,
        guardian_name = ?,
        guardian_phone = ?,
        status = ?,
        profile_image = ?
      WHERE student_id = ?`,
      [
        full_name,
        email,
        mobile_number,
        mother_name,
        father_name,
        blood_group,
        class_id,
        section_id,
        admission_date,
        date_of_birth,
        gender,
        address,
        city,
        state,
        pincode,
        guardian_name,
        guardian_phone,
        status || "active",
        profile_image,
        student_id
      ]
    );

    res.status(200).json({
      message: "Student profile updated successfully",
      profile_image
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

