const nodemailer = require("nodemailer");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // porta segura
    secure: true, // true = usa SSL/TLS
    auth: {
      user: "conectaleto123@gmail.com",
      pass: "Conect_T@lento"
    }
  });

// Wrap in an async IIFE so we can use await.
const sendMail = async (from_, to_, subject_, text_, html_) => {
  const info = await transporter.sendMail({
    from: from_,
    to: to_,
    subject: subject_,
    text: text_, // plain‑text body
    html: html_, // HTML body
  });

  console.log("Message sent:", info.messageId);
};

module.exports = sendMail;