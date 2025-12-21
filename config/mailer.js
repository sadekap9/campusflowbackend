const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendTeacherCredentials = async (toEmail, password, emp_id) => {
  await transporter.sendMail({
    from: `"School Admin" <${process.env.EMAIL}>`,
    to: toEmail,
    subject: "Your Login Credentials",
    html: `
      <h3>Welcome to School</h3>
      <p><b>Employee ID:</b> ${emp_id}</p>
      <p><b>Email:</b> ${toEmail}</p>
      <p><b>Password:</b> ${password}</p>
    `,
  });
};
const sendStudentCredentials = async (toEmail, password, enrollment_no) => {
  await transporter.sendMail({
    from: `"School Admin" <${process.env.EMAIL}>`,
    to: toEmail,
    subject: "Your Login Credentials",
    html: `
      <h3>Welcome to School</h3>
      <p><b>Employee ID:</b> ${enrollment_no}</p>
      <p><b>Email:</b> ${toEmail}</p>
      <p><b>Password:</b> ${password}</p>
    `,
  });
};


module.exports = { sendTeacherCredentials, sendStudentCredentials };

