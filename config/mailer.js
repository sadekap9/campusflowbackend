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


const sendForgotPasswordEmail = async (toEmail, newPassword) => {
  await transporter.sendMail({
    from: `"School Admin" <${process.env.EMAIL}>`,
    to: toEmail,
    subject: "Reset Password",
    html: `
      <h3>Password Reset Successful</h3>
      <p>Hello,</p>
      <p>Your password has been reset successfully. Please use the following temporary password to login:</p>
      <p><b>New Password:</b> ${newPassword}</p>
      <p>We recommend you change your password after logging in.</p>
    `,
  });
};

module.exports = { sendTeacherCredentials, sendStudentCredentials, sendForgotPasswordEmail };

