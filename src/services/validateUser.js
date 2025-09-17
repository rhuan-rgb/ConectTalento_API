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

  sendCodeToEmail: async function (email, ID_user) {
    const code = await sendMail(email, ID_user);
    if (code) {
      return code;
    } else {
      return false
    }
  },

  checkIfEmailCadastrado: async function (email) {
    return new Promise((resolve, reject) => {
      const query = "SELECT ID_user FROM usuario WHERE email = ? AND autenticado = true LIMIT 1";
      connect.query(query, [email], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results.length > 0); // true se já existe, false se não existe
      });
    });
  },

  checkIfEmailExiste: async function (email) {
    return new Promise((resolve, reject) => {
      const query = "SELECT ID_user FROM usuario WHERE email = ? AND autenticado IS NOT TRUE LIMIT 1";
      connect.query(query, [email], (err, results) => {
        if (err) {
          return reject(err);
        }
        if (results.length > 0) {
          resolve(results)// true, passa o id se já existe,
        } else {
          resolve(false);  // false se não existe
        }

      });
    });
  },

  validateUserName: async function (username) {
    return new Promise((resolve, reject) => {
      const query = "SELECT 1 FROM usuario WHERE username = ? AND autenticado = true LIMIT 1";
      connect.query(query, [username], (err, results) => {
        if (err) {
          return reject(err);
        }
        resolve(results.length > 0); // true se já existe, false se não existe
      });
    });
  },

  validateCode: async function (userEmail, code) {
    // 1) descobrir o ID_user a partir do e-mail
    const idUser = await new Promise((resolve, reject) => {
      const query = "SELECT ID_user FROM usuario WHERE email = ? LIMIT 1";
      connect.query(query, [userEmail], (err, rows) => {
        if (err) return reject(err);
        if (!rows.length) return resolve(null);
        resolve(rows[0].ID_user);
      });
    });
    if (!idUser) return false;

    // 2) conferir o código para esse ID_user
    const query2 = `SELECT code, code_expira_em
              FROM code_validacao
              WHERE ID_user = ? AND code = ?
              LIMIT 1`;

    return new Promise((resolve) => {
      connect.query(query2, [idUser, code], (err, rows) => {
        if (err) return resolve(false);
        if (!rows.length) return resolve(false);

        const expiresAt = new Date(rows[0].code_expira_em);
        if (expiresAt < new Date()) return resolve("expirado");
        return resolve(true);
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
  