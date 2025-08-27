const sendMail = require("./nodemailerConfig");
const connect = require("../db/connect");

const validateUser = {


  validateDataEmail: function (email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !regex.test(email)) {
      return { error: "Email inválido" };
    }
    return false;
  },

  validateEmail: async function (email) {

    //verificar se o email já existe no db

    const code = await sendMail(email);
    if (code) {


      return code;
    } else {
      return false
    }
  },

  validateCode: function (userEmail, code) {
    const query = `SELECT code FROM code_validacao WHERE email = ? AND code = ? LIMIT 1`;

    return new Promise((resolve, reject) => {
      connect.query(query, [userEmail, code], (err, results) => {
        if (err) {
          console.log(err);
          return resolve(false);
        }
        if (results.length > 0 && results[0].code === code) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

};

module.exports = validateUser;
