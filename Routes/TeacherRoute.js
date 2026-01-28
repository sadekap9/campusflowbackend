const express = require("express");
const router = express.Router();
const { TeacherLogin, ForgotPassword } = require("../auth/teacher/Login");
const { GetTeacherTimetable, GetAssignedClassTimetable } = require("../controller/teacher/ViewTimetable");
const { MarkAttendance, GetAttendance, UpdateAttendance, DeleteAttendance } = require("../controller/teacher/TeacherAttendanceController");
const { GetAllAssignedStudents, GetSubjectStudents } = require("../controller/teacher/ViewStudents");

/* =========================================================
   AUTH ROUTES
   ========================================================= */
router.post("/login", TeacherLogin);
router.post("/forgot-password", ForgotPassword);
/* =========================================================
   TIMETABLE ROUTES
   ========================================================= */

// Get personal schedule (lectures)
router.get("/timetable/:teacher_id", GetTeacherTimetable);

// Get full timetable for classes they are in charge of
router.get("/class-timetable/:teacher_id", GetAssignedClassTimetable);

router.get("/students/:teacher_id", GetAllAssignedStudents);

// NEW: Get students teacher teaches based on materials/subjects assignment
router.get("/subject-students/:teacher_id", GetSubjectStudents);
/* =========================================================
   ATTENDANCE ROUTES
   ========================================================= */

router.post("/attendance", MarkAttendance);
router.get("/attendance", GetAttendance);
router.patch("/attendance/:attendance_id", UpdateAttendance);
router.delete("/attendance/:attendance_id", DeleteAttendance);

module.exports = router;
