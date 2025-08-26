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

  validateEmail: function (email) {

    //verificar se o email já existe no db

    const code = sendMail(email);
    if(code){

      
      return code;
    } else {
      return false
    }
  },

  validateCode: function (userEmail, code){ //criar index pro code no banco de dados
    const query = `SELECT code FROM usuario WHERE email = ${userEmail}`;
    connect.query(query, (err) =>{
      if(err){
        console.log(err);
      }
    })
  }
};

module.exports = validateUser;
