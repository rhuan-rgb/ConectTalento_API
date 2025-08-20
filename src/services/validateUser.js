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

  return false;
};
