const express = require("express");
const router = express.Router();
const { TeacherLogin, ForgotPassword } = require("../auth/teacher/Login");
const { GetTeacherTimetable, GetAssignedClassTimetable } = require("../controller/teacher/ViewTimetable");
const { MarkAttendance, GetAttendance, UpdateAttendance, DeleteAttendance } = require("../controller/teacher/TeacherAttendanceController");
const { GetAllAssignedStudents, GetSubjectStudents } = require("../controller/teacher/ViewStudents");
const { 
  markAttendance: markStudentAttendance, 
  getAttendance: getStudentAttendance, 
  updateAttendance: updateStudentAttendance, 
  deleteAttendance: deleteStudentAttendance 
} = require("../controller/teacher/StudentAttendanceController");
const authTeacher = require("../middleware/authTeacher");

/* =========================================================
   AUTH ROUTES
   ========================================================= */
router.post("/login", TeacherLogin);
router.post("/forgot-password", ForgotPassword);
/* =========================================================
   TIMETABLE ROUTES (PROTECTED)
   ========================================================= */

// Get personal schedule (lectures)
router.get("/timetable/:teacher_id", authTeacher, GetTeacherTimetable);

// Get full timetable for classes they are in charge of
router.get("/class-timetable/:teacher_id", authTeacher, GetAssignedClassTimetable);

router.get("/students/:teacher_id", authTeacher, GetAllAssignedStudents);

// NEW: Get students teacher teaches based on materials/subjects assignment
router.get("/subject-students/:teacher_id", authTeacher, GetSubjectStudents);
/* =========================================================
   ATTENDANCE ROUTES (PROTECTED)
   ========================================================= */

router.post("/attendance", authTeacher, MarkAttendance);
router.get("/attendance", authTeacher, GetAttendance);
router.patch("/attendance/:attendance_id", authTeacher, UpdateAttendance);
router.delete("/attendance/:attendance_id", authTeacher, DeleteAttendance);

/* =========================================================
   STUDENT ATTENDANCE ROUTES (PROTECTED)
   ========================================================= */

router.post("/student-attendance/:teacher_id", authTeacher, markStudentAttendance);
router.get("/student-attendance/:teacher_id", authTeacher, getStudentAttendance);
router.patch("/student-attendance/:teacher_id/:attendance_id", authTeacher, updateStudentAttendance);
router.delete("/student-attendance/:teacher_id/:attendance_id", authTeacher, deleteStudentAttendance);

module.exports = router;
