const sendMail = require("./nodemailerConfig");
const connect = require("../db/connect");
const bcrypt = require("bcrypt");

const validateUser = {


  validateDataEmail: function (email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !regex.test(email)) {
      return false;
    }
    return true;
  },

  validateEmail: async function (email) {

    const code = await sendMail(email);
    if (code) {
      return code;
    } else {
      return false
    }
  },

  checkIfEmailExists: async function (email) {
    return new Promise((resolve, reject) => {
      const query = "SELECT id_usuario FROM usuario WHERE email = ? LIMIT 1";
      connect.query(query, [email], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results.length > 0); // true se já existe, false se não existe
      });
    });
  },


  validateCode: function (userEmail, code) {
    const query = `SELECT code, code_expira_em 
                 FROM code_validacao 
                 WHERE email = ? AND code = ? 
                 LIMIT 1`;

    return new Promise((resolve, reject) => {
      connect.query(query, [userEmail, code], (err, results) => {
        if (err) {
          return resolve(false);
        }

        if (results.length === 0) {
          return resolve(false); // nenhum código encontrado
        }

        const now = new Date(Date.now());
        const dbCode = results[0].code;
        const expiresAt = results[0].code_expira_em;

        if (expiresAt < now) {
          return resolve("expirado"); // código vencido
        }

        if (dbCode === code) {
          return resolve(true); // válido
        }

        return resolve(false);
      });
    });
  },

  // número de "salt rounds" = custo computacional


  hashPassword: async function (password) {
    const saltRounds = 10;
    try {
      const hashed = await bcrypt.hash(password, saltRounds);
      return hashed;
    } catch (err) {
      console.error(err);
    }
  },

  comparePassword: async function (password, hashedPassword) {
    try {
      const match = await bcrypt.compare(password, hashedPassword);
      return match;
    } catch (err) {
      console.error(err);
      return false;
    }
  }




};

module.exports = validateUser;
