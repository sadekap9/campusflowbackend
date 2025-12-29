const express = require("express");
const router = express.Router();

const { Login } = require("../auth/admin/Login");
const { registerStudentProfile } = require("../auth/admin/RegisterStudent");
const studentProfileUpload = require("../middleware/studentProfileUpload");
const { registerTeacher } = require("../auth/admin/RegisterTeacher");
const teacherUpload = require("../middleware/teacherUpload");
const {AddClasses} = require ("../controller/admin/classes/Classes")
const {AddSection} = require ("../controller/admin/Sections");
const { ListStudent } = require("../controller/admin/students/ListStudent");
const { GetClass } = require("../controller/admin/classes/GetClass");
const {UpdateClass , DeleteSection} = require("../controller/admin/classes/UpdateClass")
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

// get student 

router.get("/getstudentlist", ListStudent)

//get class

router.get("/getclass", GetClass)

router.put("/section/:section_id/teacher", UpdateClass);
router.delete("/section/:section_id", DeleteSection);


module.exports = router;
