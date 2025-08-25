const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // porta segura
  secure: true, // true = usa SSL/TLS
  auth: {
    user: process.env.nodemailer_user,
    pass: process.env.nodemailer_pass,
  },
});

// Wrap in an async IIFE so we can use await.
const sendMail = async (userEmail) => {
  function mailCode(){

  }
  try {
    const info = await transporter.sendMail({
      from: `ConectTalento <${process.env.nodemailer_user}>`,
      to: userEmail,
      subject: "hello",
      text: "salve jao", // plain‑text body
      // html: html_, // HTML body
    });
  } catch (err) {
    console.log("mensagem não enviada", err);
  }
};

module.exports = sendMail;
