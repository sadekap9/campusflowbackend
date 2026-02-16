const express = require("express");
const router = express.Router();
const { StudentLogin, ForgotPassword } = require("../auth/student/Login");
const { GetStudentProfile } = require("../controller/student/ProfileController");
const { GetStudentTimetable } = require("../controller/student/TimetableController");
const { GetMyTeachers } = require("../controller/student/TeacherInfoController");
const { GetMyExams, GetMyExamMarks } = require("../controller/student/ExamController");
const { GetMyAssignments, SubmitAssignment, GetMyGrades } = require("../controller/student/AssignmentController");
const { GetMyAttendance } = require("../controller/student/AttendanceController");
const authStudent = require("../middleware/authStudent");
const assignmentUpload = require("../middleware/assignmentUpload");

/* =========================
   AUTH ROUTES
   ========================= */
router.post("/login", StudentLogin);
router.post("/forgot-password", ForgotPassword);

/* =========================
   PROFILE ROUTES (PROTECTED)
   ========================= */
// A student can only see their own profile. 
// The middleware verify that :student_id matches the logged-in student's ID.
router.get("/profile/:student_id", authStudent, GetStudentProfile);

/* =========================
   TIMETABLE ROUTES (PROTECTED)
   ========================= */
router.get("/timetable/:student_id", authStudent, GetStudentTimetable);

/* =========================
   TEACHER INFO ROUTES (PROTECTED)
   ========================= */
router.get("/my-teachers/:student_id", authStudent, GetMyTeachers);

/* =========================
   EXAM ROUTES (PROTECTED)
   ========================= */
router.get("/my-exams/:student_id", authStudent, GetMyExams);
router.get("/my-exam-marks/:student_id", authStudent, GetMyExamMarks);

/* =========================
   ASSIGNMENT ROUTES (PROTECTED)
   ========================= */
router.get("/assignments/:student_id", authStudent, GetMyAssignments);
router.post("/assignment/submit/:student_id/:assignment_id", authStudent, assignmentUpload.single('file'), SubmitAssignment);
router.get("/my-grades/:student_id", authStudent, GetMyGrades);
router.get("/attendance/:student_id", authStudent, GetMyAttendance);

module.exports = router;




