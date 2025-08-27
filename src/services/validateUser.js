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
    const query = `SELECT code FROM code_validacao WHERE email = ? and code = ?`;
    connect.query(query, [userEmail, code], (err, results) =>{
      if(err){
        console.log(err);
      } else {
        if(results[0].code === code){
          return true
        } else {
          return false
        }
        
      }
    })
  }
};

module.exports = validateUser;
