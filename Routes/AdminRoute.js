const express = require("express");
const router = express.Router();

/* ===========================
   AUTH / LOGIN
=========================== */
const { Login } = require("../auth/admin/Login");

/* ===========================
   MIDDLEWARES
=========================== */
const studentProfileUpload = require("../middleware/studentProfileUpload");
const teacherUpload = require("../middleware/teacherUpload");

/* ===========================
   STUDENT CONTROLLER (NEW)
=========================== */
const {
  GetStudent,
  UpdateStudent,
  DeleteStudent
} = require("../controller/admin/students/GetStudent");

const { ListStudent } = require("../controller/admin/students/ListStudent");
const { registerStudentProfile } = require("../auth/admin/RegisterStudent");

/* ===========================
   TEACHER CONTROLLER (NEW)
=========================== */
const {
  GetTeacher,
  UpdateTeacher,
  DeleteTeacher
} = require("../controller/admin/teachers/GetTeacher");

const { ListTeacher } = require("../controller/admin/teachers/ListTeacher");
const { registerTeacher } = require("../auth/admin/RegisterTeacher");

/* ===========================
   CLASS & SECTION MODULE
=========================== */
const { AddClasses } = require("../controller/admin/classes/Classes");
const { GetClass } = require("../controller/admin/classes/GetClass");
const {
  UpdateClass,
  DeleteSection
} = require("../controller/admin/classes/UpdateClass");
const { AddSection } = require("../controller/admin/Sections");
const {
  AddTimetable,
  GetTimetable,
  DeleteTimetable
} = require("../controller/admin/TimetableController");
//console.log("AdminRoute.js: AddTimetable import type:", typeof AddTimetable);

const { UpdateTimetable } =
  require("../controller/admin/UpdateTimetable");

const { AssignProxyTeacher } =
  require("../controller/admin/AssignProxyTeacher");
  const {
  AssignSubjectToTeacher,
  GetAssignedSubjects,
  GetAssignedTeachersByClass,
  UpdateAssignedSubject
} = require("../controller/admin/TeacherSubjectController");

const {
  CreateExam,
  UpdateExam,
  CancelExam,
  CreateExamSubject,
  GetAllExams,
  GetExamSubjects,
  UpdateExamSubject
} = require("../controller/admin/ExamController");

const {
  addSubject,
  updateSubject,
  deleteSubject,
  listSubjects,
  getSubject
} = require("../controller/admin/SubjectController");

/* =========================================================
   ROUTES
========================================================= */

/* ---------- Admin Login ---------- */
router.post("/login", Login);

/* ---------- Student APIs ---------- */

// Register student
router.post(
  "/students/register",
  studentProfileUpload.single("profile_image"),
  registerStudentProfile
);

// List students
router.get("/students", ListStudent);

// Get single student
router.get("/students/:student_id", GetStudent);

// Update student
router.put(
  "/students/:student_id",
  studentProfileUpload.single("profile_image"),
  UpdateStudent
);

// Delete student
router.delete(
  "/students/:student_id",
  DeleteStudent
);

/* ---------- Teacher APIs ---------- */

// Register teacher
router.post(
  "/teachers/register",
  teacherUpload.single("profile_image"),
  registerTeacher
);

// List teachers
router.get("/teachers", ListTeacher);

// Get single teacher
router.get("/teachers/:teacher_id", GetTeacher);

// Update teacher
router.put(
  "/teachers/:teacher_id",
  teacherUpload.single("profile_image"),
  UpdateTeacher
);

// Delete teacher
router.delete(
  "/teachers/:teacher_id",
  DeleteTeacher
);

/* ---------- Class APIs ---------- */

// Add class
router.post("/classes", AddClasses);

// Get all classes
router.get("/getclass", GetClass);

/* ---------- Section APIs ---------- */

// Add section to class
router.post("/classes/:class_id/sections", AddSection);

// Assign teacher / update section
router.put("/sections/:section_id/teacher", UpdateClass);

// Delete section
router.delete("/section/:section_id", DeleteSection);
/* ---------- Timetable APIs ---------- */

// Add timetable entry
console.log("Registering POST /timetable");
router.post("/timetable", AddTimetable);

// Get timetable (class + section)
router.get("/timetable", GetTimetable);

// Delete timetable entry
router.delete("/timetable/:timetable_id", DeleteTimetable);

// ✅ NORMAL UPDATE
router.put("/timetable/:timetable_id", UpdateTimetable);

// ✅ PROXY UPDATE
router.put("/timetable/:timetable_id/proxy", AssignProxyTeacher);
router.post(
  "/assign-subject-teacher",
  AssignSubjectToTeacher
);

router.get(
  "/assign-subject-teacher",
  GetAssignedSubjects
);

router.get(
  "/assign-subject-teacher/:class_id",
  GetAssignedTeachersByClass
);

router.put(
  "/assign-subject-teacher/:teacher_subject_id",
  UpdateAssignedSubject
);

router.post("/exam", CreateExam);
router.get("/exam", GetAllExams);
router.put("/exam/:exam_id", UpdateExam);
router.put("/exam/:exam_id/cancel", CancelExam);
router.post("/exam/subject", CreateExamSubject);
router.get("/exam/:exam_id/subjects", GetExamSubjects);
router.put("/exam/subject/:exam_subject_id", UpdateExamSubject);

/* ---------- Subject APIs ---------- */
router.get("/subjects", listSubjects);
router.get("/subjects/:subject_id", getSubject);
router.post("/subjects", addSubject);
router.put("/subjects/:subject_id", updateSubject);
router.delete("/subjects/:subject_id", deleteSubject);

module.exports = router;
