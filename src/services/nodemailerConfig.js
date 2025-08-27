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
    const idx = crypto.randomInt(0, chars.length);
    code += chars[idx];
  }

  const query = `
    INSERT INTO code_validacao (code, code_expira_em, email)
    VALUES (?, NOW() + INTERVAL 15 MINUTE, ?);
  `;

  return new Promise((resolve, reject) => {
    connect.query(query, [code, userEmail], (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          resolve(false); // código duplicado → tente outro
        } else {
          console.error("Erro ao inserir código:", err);
          resolve("dont_repeat"); // erro inesperado → sair do loop
        }
      } else {
        resolve(code); // deu certo, retornamos o código
      }
    });
  });
}


const sendMail = async (userEmail) => {
  try {
    let code = null;
    let attempts = 0; // limitar tentativas
    const maxAttempts = 10;

    while (!code && attempts < maxAttempts) {
      const result = await generateCode(userEmail);

      if (result === "dont_repeat") {
        throw new Error("Erro inesperado ao gerar código");
      }

      if (result) {
        code = result; // código válido gerado
      }

      attempts++;
    }

    if (!code) {
      throw new Error("Não foi possível gerar um código único após várias tentativas");
    }

    const info = await transporter.sendMail({
      from: `ConectTalento <${process.env.nodemailer_user}>`,
      to: userEmail,
      subject: "Seu código de verificação",
      text: `Aqui está seu código, copie e cole no site: ${code}`,
    });

    return code;
  } catch (err) {
    console.error("mensagem não enviada:", err);
    return null;
  }
};


module.exports = sendMail;