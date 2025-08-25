const sendMail = require("./nodemailerConfig"); // verificar se o caminho está correto

const validateUser = {
  //gera código de 6 dígitos para o cadastro
  generateCode: function () {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      const idx = crypto.randomInt(0, chars.length); // índice aleatório
      code += chars[idx];
    }

    // enviar código ao sql antes de retornar, para checar se ele já está vinculado a algum usuário.
    // se estiver, criar outro código e verificar denovo (loop).

    //lembre-se de enviar response.valid para o front/mobile
    return code;
  },

  validateDataEmail: function (email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !regex.test(email)) {
      return { error: "Email inválido" };
    }
    return false;
  },

  validateEmail: function (email) {
    sendMail(email);
  },
};

module.exports = validateUser;
