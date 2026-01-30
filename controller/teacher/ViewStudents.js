const db = require("../../config/db");

exports.GetAllAssignedStudents = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required"
      });
    }

    /* =========================================================
       1️⃣ Get students only for sections where this teacher 
          is assigned as the Class Teacher (from sections table)
    ========================================================= */
    const [students] = await db.query(
      `
      SELECT
        sp.student_id,
        sp.full_name,
        sp.enrollment_no,
        sp.email,
        sp.phone,
        sp.gender,
        sp.profile_image,
        sp.status,
        c.class_id,
        sec.section_id,
        c.class_name,
        sec.section_name
      FROM student_profile sp
      JOIN classes c ON c.class_id = sp.class_id
      JOIN sections sec ON sec.section_id = sp.section_id
      WHERE sec.teacher_id = ?
      ORDER BY c.class_name, sec.section_name, sp.full_name
      `,
      [teacher_id]
    );

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        message: "No students found for classes assigned to this teacher",
        students: []
      });
    }

    return res.status(200).json({
      success: true,
      total: students.length,
      students
    });

  } catch (error) {
    console.error("GetAllAssignedStudents error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
};

/* =========================================================
   2️⃣ GET SUBJECT STUDENTS
   Fetch students from classes where this teacher is assigned
   as a subject teacher in the teacher_subject table.
========================================================= */
exports.GetSubjectStudents = async (req, res) => {
  try {
    const { teacher_id } = req.params;

    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "teacher_id is required"
      });
    }

    // 1. Fetch students for all classes assigned to this teacher in teacher_subject
    // We join classes and sections to get the full info.
    // If teacher_subject only has class_id, we fetch all students in that class across all sections.
    const [students] = await db.query(
      `
      SELECT DISTINCT
        sp.student_id,
        sp.full_name,
        sp.enrollment_no,
        sp.email,
        sp.phone,
        sp.gender,
        sp.profile_image,
        c.class_name,
        sec.section_name,
        sub.subject_name
      FROM student_profile sp
      JOIN classes c ON c.class_id = sp.class_id
      JOIN sections sec ON sec.section_id = sp.section_id
      JOIN teacher_subject ts ON ts.class_id = sp.class_id
      JOIN subjects sub ON ts.subject_id = sub.subject_id
      WHERE ts.teacher_id = ? AND ts.status = 'active'
      ORDER BY c.class_name, sec.section_name, sp.full_name
      `,
      [teacher_id]
    );

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        total: 0,
        message: "No students found for subjects assigned to this teacher",
        students: []
      });
    }

    return res.status(200).json({
      success: true,
      total: students.length,
      students
    });

  } catch (error) {
    console.error("GetSubjectStudents error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
};
