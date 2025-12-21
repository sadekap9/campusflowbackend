const express = require("express");
const router = express.Router();

const { Login } = require("../auth/admin/Login");
const { registerStudentProfile } = require("../auth/admin/RegisterStudent");
const studentProfileUpload = require("../middleware/studentProfileUpload");
const { registerTeacher } = require("../auth/admin/RegisterTeacher");
const teacherUpload = require("../middleware/teacherUpload");
const {AddClasses} = require ("../controller/admin/Classes")
const {AddSection} = require ("../controller/admin/Sections")
// Login
router.post("/login", Login);
// register student
router.post(
  "/register",
  studentProfileUpload.single("profile_image"),
  registerStudentProfile
);
//register teacher
router.post(
  "/teacher/register",
  teacherUpload.single("profile_image"),
  registerTeacher
);

// add classes
router.post("/classes", AddClasses);
router.post("/:class_id/section", AddSection)

module.exports = router;
