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
  deleteAssignment,
  GetSubmissions
} = require("../controller/teacher/AssignmentController");
const {
  AddOrUpdateAssignmentMarks,
  GetAssignmentMarks,
  GiveDefaultZeroToAbsentees
} = require("../controller/teacher/AssignmentMarksController");
const { GetClassTeacherExams, GetSubjectTeacherExams } = require("../controller/teacher/ExamController");
const { GradeExamMarks, GetSubjectTeacherMarks, GetClassTeacherMarks, GetStudentFullResult } = require("../controller/teacher/ExamMarksController");
const { GetTeacherClassesAndSections } = require("../controller/teacher/TeacherClassController");
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
router.get("/timetable/:teacher_id", authTeacher, GetTeacherTimetable);
router.get("/class-timetable/:teacher_id", authTeacher, GetAssignedClassTimetable);

/* =========================================================
   STUDENT/CLASS INFO ROUTES (PROTECTED)
   ========================================================= */
router.get("/students/:teacher_id", authTeacher, GetAllAssignedStudents);
router.get("/subject-students/:teacher_id", authTeacher, GetSubjectStudents);
router.get("/classes/:teacher_id", authTeacher, GetTeacherClassesAndSections);

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
router.delete("/assignment/file/:file_id", authTeacher, deleteAssignmentFile);
router.get("/assignment/submissions/:assignment_id", authTeacher, GetSubmissions);

/* =========================================================
   ASSIGNMENT MARKS ROUTES (PROTECTED)
   ========================================================= */
router.post("/assignment/marks", authTeacher, AddOrUpdateAssignmentMarks);
router.get("/assignment/marks/:assignment_id", authTeacher, GetAssignmentMarks);

router.post("/assignment/marks/auto-zero", authTeacher, GiveDefaultZeroToAbsentees);

/* =========================================================
   EXAM MARKS ROUTES (PROTECTED)
   ========================================================= */
router.post("/exam/marks", authTeacher, GradeExamMarks);
router.get("/exam/marks/subject", authTeacher, GetSubjectTeacherMarks);
router.get("/exam/marks/class", authTeacher, GetClassTeacherMarks);
router.get("/exam/marks/student-result", authTeacher, GetStudentFullResult);

/* =========================================================
   EXAM SCHEDULE ROUTES (PROTECTED)
   ========================================================= */
router.get("/exams/class/:teacher_id", authTeacher, GetClassTeacherExams);
router.get("/exams/subject/:teacher_id", authTeacher, GetSubjectTeacherExams);

module.exports = router;
