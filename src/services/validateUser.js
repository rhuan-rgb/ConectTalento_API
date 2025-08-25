const sendMail = require("./nodemailerConfig"); // verificar se o caminho está correto


const validateUser = {
    
  
    validateDataEmail: function (email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !regex.test(email)) {
        return { error: "Email inválido" };
      }
      return false;
    },

    validateEmail: function (email){
        sendMail(email)
    }
  };
  
  module.exports = validateUser;  