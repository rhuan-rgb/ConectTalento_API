const nodemailer = require("nodemailer");
const crypto = require("crypto");
const connect = require("../db/connect");

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

//gera código de 6 dígitos para o cadastro
function generateCode(userEmail) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, chars.length); // índice aleatório
    code += chars[idx];
  }
  // checa se este código já está vinculado a outro usuário
  const query = `INSERT INTO code_validacao (code, code_expira_em, email) VALUES (?, NOW() + INTERVAL 10 MINUTE, ?);`;
  try {
    connect.query(query, code, userEmail, (err) => {
      if (err === "ER_DUP_ENTRY") {
        return false;
      } else if (err) {
        console.log("erro ao inserir o código gerado no usuário", err);
        return "dont_repeat";
      } else {
        return code;
      }
    })
  } catch (error) {
    console.log(error);
  }

}

// Wrap in an async IIFE so we can use await.
const sendMail = async (userEmail) => {
  try {
    let code = false;
    while (true) {
      code = generateCode(userEmail);
      if (code === "dont_repeat") {
        break
      }
      if (code === true) {
        break
      }
    }


    const info = await transporter.sendMail({
      from: `ConectTalento <${process.env.nodemailer_user}>`,
      to: userEmail,
      subject: "Seu código de verificação",
      text: `Aqui está seu código, copie e cole no site: ${code}`, // plain‑text body
      // html: html_, // HTML body
    });
    return code;


  } catch (err) {
    return ("mensagem não enviada", err);
  }
};

module.exports = sendMail;