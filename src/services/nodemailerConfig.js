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
function generateCode(ID_user) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = crypto.randomInt(0, chars.length);
    code += chars[idx];
  }

  const query = `
    INSERT INTO code_validacao (code, code_expira_em, ID_user)
    VALUES (?, NOW() + INTERVAL 15 MINUTE, ?);
  `;

  return new Promise((resolve, reject) => {
    connect.query(query, [code, ID_user], (err) => {
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


const sendMail = async (userEmail, ID_user) => {
  try {
    let code = null;
    let attempts = 0; // limitar tentativas
    const maxAttempts = 10;

    while (!code && attempts < maxAttempts) {
      const result = await generateCode(ID_user);

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
  html: `
  <div style="font-family: Arial, sans-serif; background-color: #f2f2f7; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
      
      <!-- Cabeçalho -->
      <div style="background: linear-gradient(90deg, #64058f, #9b4dca); color: #ffffff; text-align: center; padding: 25px; font-size: 26px; font-weight: bold; letter-spacing: 1px;">
        ConectTalento
      </div>
      
      <!-- Corpo -->
      <div style="padding: 30px; color: #333333; line-height: 1.8; font-size: 16px;">
        <p style="margin: 0 0 15px;">Olá,</p>
        <p style="margin: 0 0 25px;">Aqui está o seu código de verificação. Copie e cole no site para continuar:</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <span style="display: inline-block; background: #64058f; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 20px 40px; border-radius: 10px; box-shadow: 0 3px 8px rgba(0,0,0,0.25);">
            ${code}
          </span>
        </div>

        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          Se você não solicitou este código, pode ignorar este e-mail.
        </p>
      </div>
      
      <!-- Rodapé -->
      <div style="background: #f9f9f9; text-align: center; padding: 20px; font-size: 13px; color: #888;">
        © ${new Date().getFullYear()} ConectTalento. Todos os direitos reservados.
      </div>

    </div>
  </div>
  `,
});


    return code;
  } catch (err) {
    console.error("mensagem não enviada:", err);
    return null;
  }
};


module.exports = sendMail;