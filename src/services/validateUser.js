import sendMail from "./nodemailerConfig"; // verificar se o caminho está correto


const validateUser = {
    validateData: function ({
      cpf,
      password,
      biografia,
      username,
      plano,
    }) {
      if (!cpf || !password || !biografia || !username || !plano) {
        return { error: "Todos os campos devem ser preenchidos" };
      } else if (isNaN(cpf) || cpf.length !== 11) {
        return {
          error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
        };
      }
  
      return false; // false = sem erros
    },
  
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