module.exports = function validateUser({
  cpf,
  email,
  password,
  biografia,
  username,
  plano,
}) {
  if (!cpf || !email || !password || !biografia || !username || !plano) {
    return { error: "Todos os campos devem ser preenchidos" };
  } else if (isNaN(cpf) || cpf.length !== 11) {
    return {
      error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
    };
  } else if (!email.includes("@")) {
    return { error: "Email inválido. Deve conter @" };
  }

  return false;
};
