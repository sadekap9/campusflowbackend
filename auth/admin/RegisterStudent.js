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
      guardian_phone
    } = req.body;

    // Required fields validation
    if (!full_name ||  !class_id || !section_id || !admission_date) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    const plainPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(plainPassword);

    // Cloudinary image URL
    const profile_image = req.file ? req.file.path : null;

    const [result] = await db.query(
      `INSERT INTO student_profile (
        full_name, mother_name, father_name,
       blood_group, class_id, section_id,
        admission_date, date_of_birth, gender,
        address, city, state, pincode,
        guardian_name, guardian_phone, profile_image,password
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        full_name, mother_name, father_name,
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


    res.status(500).json({ message: "Server error" });
  }
};
