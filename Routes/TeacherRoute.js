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
const {
  createAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignmentFile,
  deleteAssignment
} = require("../controller/teacher/AssignmentController");
const { GetClassTeacherExams, GetSubjectTeacherExams } = require("../controller/teacher/ExamController");
const authTeacher = require("../middleware/authTeacher");
const assignmentUpload = require("../middleware/assignmentUpload");

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
router.get("/attendance/:teacher_id", authTeacher, GetAttendance);
router.patch("/attendance/:attendance_id", authTeacher, UpdateAttendance);
router.delete("/attendance/:attendance_id", authTeacher, DeleteAttendance);

/* =========================================================
   STUDENT ATTENDANCE ROUTES (PROTECTED)
   ========================================================= */

router.post("/student-attendance/:teacher_id", authTeacher, markStudentAttendance);
router.get("/student-attendance/:teacher_id", authTeacher, getStudentAttendance);
router.patch("/student-attendance/:teacher_id/:attendance_id", authTeacher, updateStudentAttendance);
router.delete("/student-attendance/:teacher_id/:attendance_id", authTeacher, deleteStudentAttendance);

/* =========================================================
   ASSIGNMENT ROUTES (PROTECTED)
   ========================================================= */

router.post("/assignment", authTeacher, assignmentUpload.array('files', 5), createAssignment);
router.get("/assignment/:teacher_id", authTeacher, getAssignments);
router.patch("/assignment/:assignment_id", authTeacher, updateAssignment);
router.delete("/assignment/:assignment_id", authTeacher, deleteAssignment);

// Assignment Files
router.delete("/assignment/file/:file_id", authTeacher, deleteAssignmentFile);

/* =========================================================
   EXAM ROUTES (PROTECTED)
   ========================================================= */

router.get("/exams/class/:teacher_id", authTeacher, GetClassTeacherExams);
router.get("/exams/subject/:teacher_id", authTeacher, GetSubjectTeacherExams);

module.exports = router;
