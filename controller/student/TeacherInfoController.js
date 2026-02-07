const db = require("../../config/db");

/* =========================================================
   GET STUDENT'S CLASS TEACHER AND SUBJECT TEACHERS
   ========================================================= */
exports.GetMyTeachers = async (req, res) => {
  try {
    const { student_id } = req.params;

    // 1️⃣ Get student's class and section info
    const [studentRows] = await db.query(
      "SELECT class_id, section_id FROM student_profile WHERE student_id = ?",
      [student_id]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const { class_id, section_id } = studentRows[0];

    // 2️⃣ Get Class Teacher Info
    const [classTeacherRows] = await db.query(
      `SELECT 
        t.teacher_id, 
        t.name AS teacher_name, 
        t.email, 
        t.phone, 
        t.profile_image, 
        t.qualification 
      FROM sections s
      JOIN teachers t ON s.teacher_id = t.teacher_id
      WHERE s.section_id = ?`,
      [section_id]
    );

    let classTeacherData = null;
    if (classTeacherRows.length > 0) {
      const ct = classTeacherRows[0];
      // Get subjects this Class Teacher takes for THIS class
      const [ctSubjects] = await db.query(
        `SELECT sub.subject_name 
         FROM teacher_subject ts
         JOIN subjects sub ON ts.subject_id = sub.subject_id
         WHERE ts.teacher_id = ? AND ts.class_id = ? AND ts.status = 'active'`,
        [ct.teacher_id, class_id]
      );
      
      classTeacherData = {
        ...ct,
        subjects_taking: ctSubjects.map(row => row.subject_name)
      };
    }

    // 3️⃣ Get Distinct Subject Teachers for this Class
    const [teachersInClass] = await db.query(
      `SELECT DISTINCT
        t.teacher_id, 
        t.name AS teacher_name, 
        t.email
      FROM teacher_subject ts
      JOIN teachers t ON ts.teacher_id = t.teacher_id
      WHERE ts.class_id = ? AND ts.status = 'active'`,
      [class_id]
    );

    // 4️⃣ Enrich each teacher with their subjects in this class AND their "Class Teacher" role
    const enrichedSubjectTeachers = await Promise.all(
      teachersInClass.map(async (teacher) => {
        // Get subjects this teacher takes for THIS class
        const [subjects] = await db.query(
          `SELECT sub.subject_name 
           FROM teacher_subject ts
           JOIN subjects sub ON ts.subject_id = sub.subject_id
           WHERE ts.teacher_id = ? AND ts.class_id = ? AND ts.status = 'active'`,
          [teacher.teacher_id, class_id]
        );

        // Check if this teacher is a Class Teacher of any section
        const [classTeacherRole] = await db.query(
          `SELECT c.class_name, s.section_name
           FROM sections s
           JOIN classes c ON s.class_id = c.class_id
           WHERE s.teacher_id = ?`,
          [teacher.teacher_id]
        );
        
        return {
          ...teacher,
          subjects_taking: subjects.map(row => row.subject_name),
          is_class_teacher_of: classTeacherRole.length > 0 
            ? `${classTeacherRole[0].class_name} - ${classTeacherRole[0].section_name}` 
            : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        class_teacher: classTeacherData,
        subject_teachers: enrichedSubjectTeachers
      }
    });

  } catch (error) {
    console.error("GetMyTeachers Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
