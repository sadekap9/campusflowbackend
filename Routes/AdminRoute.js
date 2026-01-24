const express = require("express");
const router = express.Router();

/* ===========================
   AUTH / LOGIN
=========================== */
const { Login } = require("../auth/admin/Login");

/* ===========================
   STUDENT MODULE
=========================== */
const {
  registerStudentProfile,
  updateStudentProfile
} = require("../auth/admin/RegisterStudent");

const studentProfileUpload = require("../middleware/studentProfileUpload");

/* ===========================
   TEACHER MODULE
=========================== */
const {
  registerTeacher,
  updateTeacher
} = require("../auth/admin/RegisterTeacher");

const teacherUpload = require("../middleware/teacherUpload");
//const  {GetTeacher} = require("../controller/admin/teachers/GetTeacher")
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

/* ===========================
   STUDENT LIST (ADMIN)
=========================== */
const { ListStudent} = require("../controller/admin/students/ListStudent");
const { GetStudent } = require("../controller/admin/students/GetStudent");


const { ListTeacher } = require("../controller/admin/teachers/ListTeacher");
const { GetTeacher } = require("../controller/admin/teachers/GetTeacher");


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

// Update student
router.put(
  "/students/:student_id",
  studentProfileUpload.single("profile_image"),
  updateStudentProfile
);

// Get student list
router.get("/students", ListStudent);
// Get single student (Admin)
router.get("/students/:student_id", GetStudent);


// Get teacher list (Admin)
router.get("/teachers", ListTeacher);
router.get("/teachers/:teacher_id",GetTeacher);

/* ---------- Teacher APIs ---------- */

// Register teacher
router.post(
  "/teachers/register",
  teacherUpload.single("profile_image"),
  registerTeacher
);

// Update teacher
router.put(
  "/teachers/:teacher_id",
  teacherUpload.single("profile_image"),
  updateTeacher
);

/* ---------- Class APIs ---------- */

// Add class
router.post("/classes", AddClasses);

// Get all classes
router.get("/classes", GetClass);

/* ---------- Section APIs ---------- */

// Add section to class
router.post("/classes/:class_id/sections", AddSection);

// Assign teacher / update section
router.put("/sections/:section_id", UpdateClass);

// Delete section
router.delete("/sections/:section_id", DeleteSection);

module.exports = router;
