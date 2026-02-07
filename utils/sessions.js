// This stores the current valid token for each teacher and student in memory
// format: { id: "current_valid_token" }
const teacherSessions = new Map();
const studentSessions = new Map();

module.exports = { teacherSessions, studentSessions };

