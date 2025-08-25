
const sendMail = require("./nodemailerConfig"); // verificar se o caminho está correto
module.exports = function validateUser({
  email,
  password,
  confirmPassword,
  username
}) {
  if (!email || !password || !confirmPassword|| !username) {
    return { error: "Todos os campos devem ser preenchidos" };
  } else if (!email.includes("@")) {
    return { error: "Email inválido. Deve conter @" };
  }


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