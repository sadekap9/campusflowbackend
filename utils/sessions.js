// This stores the current valid token for each teacher in memory
// format: { teacher_id: "current_valid_token" }
const teacherSessions = new Map();

module.exports = { teacherSessions };
