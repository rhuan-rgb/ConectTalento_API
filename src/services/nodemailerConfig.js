const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // porta segura
    secure: true, // true = usa SSL/TLS
    auth: {
      user: process.env.nodemailer_user,
      pass: process.env.nodemailer_pass
    }
  });

// Wrap in an async IIFE so we can use await.
const sendMail = async ( userEmail) => {
  const info = await transporter.sendMail({
    from: `ConectTalento <${process.env.nodemailer_user}>`,
    to: userEmail,
    subject: "hello",
    text: "hehe", // plain‑text body
    // html: html_, // HTML body
  });

  console.log("Message sent:", info.messageId);
};

module.exports = sendMail;