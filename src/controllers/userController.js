const connect = require("../db/connect");
const jwt = require("jsonwebtoken");
const validateUser = require("../services/validateUser");
const bcrypt = require("bcrypt");

module.exports = class userController {
  static async createUser(req, res) {
    const { email, password, confirmPassword, username } = req.body;

    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!email || !password || !confirmPassword || !username) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }

    // Verifica se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "As senhas não coincidem" });
    }

    if (!validateUser.validateDataEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    } else {

      const emailExistente = await validateUser.checkIfEmailExists(email);

      if (emailExistente) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      try {
        const hashedPassword = await validateUser.hashPassword(password);
        const query = `INSERT INTO usuario (email, senha, username, autenticado, criado_em, plano) VALUES (?, ?, ?, false, NOW(), false)`;

        connect.query(
          query,
          [email, hashedPassword, username],
          (err, results) => {
            if (err) {
              if (err.code === "ER_DUP_ENTRY") {
                if (err.message.includes("email")) {
                  return res.status(400).json({ error: "Email já cadastrado" });
                }
              } else {
                return res
                  .status(500)
                  .json({ error: "Erro interno do servidor", err });
              }
            }

            // Buscar o usuário recém criado para gerar o token
            const selectQuery = `SELECT * FROM usuario WHERE email = ?`;
            connect.query(selectQuery, [email], (err, results) => {
              if (err) {
                console.log(err);
                return res
                  .status(500)
                  .json({ error: "Erro Interno do Servidor" });
              }

              if (results.length === 0) {
                return res
                  .status(404)
                  .json({ error: "Usuário não encontrado" });
              }

              const user = results[0];

              // Gerar token JWT
              const token = jwt.sign(
                { ID_user: user.ID_user }, // payload
                process.env.SECRET, // chave secreta
                { expiresIn: "1h" } // tempo de expiração
              );

              // Remover a senha do objeto antes de enviar
              delete user.senha;

              return res.status(201).json({
                message: "Usuário criado com sucesso",
                registered: false,
                user,
                token,
              });
            });
          }
        );
      } catch (error) {
        return res.status(500).json({ error });
      }
    }
  }

  static async loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "O Email e a Senha são obrigatórios para o login!" });
    }

    const query = `SELECT * FROM usuario WHERE email = ?`;

    try {
      connect.query(query, [email], async (err, results) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Erro Interno do Servidor" });
        }

        // Verificar se o usuário foi encontrado
        if (results.length === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const user = results[0];

        // Verificar se a senha corresponde

        const senhaValida = await validateUser.comparePassword(
          password,
          user.senha
        );
        if (!senhaValida) {
          return res.status(403).json({ error: "Senha Incorreta" });
        }

        // Gerar o token de autenticação
        const token = jwt.sign(
          { ID_user: user.ID_user }, // Usar ID_user no payload do token
          process.env.SECRET, // Chave secreta do ambiente
          { expiresIn: "1h" } // Expiração do token
        );

        // Remover a senha do objeto de resposta antes de enviar ao cliente
        delete user.senha;

        // Retornar os dados do usuário e o token
        return res.status(200).json({
          message: "Login bem sucedido!",
          user,
          token,
        });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Erro interno do Servidor" });
    }
  }

  static async getAllUsers(req, res) {
    const query = `SELECT ID_user, email, username, biografia, plano FROM usuario`;

    try {
      connect.query(query, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro Interno do Servidor" });
        }
        return res.status(200).json({
          message: "Mostrando usuários: ",
          users: results,
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Um erro foi encontrado." });
    }
  }

  static async updateUser(req, res) {
    const {
      email,
      password,
      confirmPassword,
      ID_user,
      biografia,
      username,
      plano,
    } = req.body;

    // Verifica se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "As senhas não coincidem" });
    }

    // Validação dos dados (incluindo CPF)
    const validationError = validateUser(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const query = `UPDATE usuario SET username=?, email=?, senha=?, biografia=?, plano=? WHERE ID_user = ?`;
    const values = [
      username,
      email,
      password, // Senha já confirmada
      biografia,
      plano,
      ID_user,
    ];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              error: "E-mail ou CPF já cadastrados por outro usuário.",
            });
          } else {
            console.error(err);
            return res.status(500).json({ error: "Erro Interno do Servidor" });
          }
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Usuário não encontrado." });
        }
        return res
          .status(200)
          .json({ message: "Usuário atualizado com sucesso." });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro Interno de Servidor" });
    }
  }

  static async deleteUser(req, res) {
    const userId = req.params.id; // Pega o ID do usuário da URL

    if (!userId) {
      return res.status(400).json({ error: "ID do usuário é necessário" });
    }

    const query = `DELETE FROM usuario WHERE ID_user = ?`; // Garante que estamos buscando pelo 'ID_user'
    const values = [userId];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro Interno do Servidor" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Usuário não encontrado." });
        }

        return res
          .status(200)
          .json({ message: "Usuário excluído com sucesso." });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro Interno de Servidor" });
    }
  }

  static async generateCode(req, res) {
    const email = req.body.email;
    console.log(req.body);
    console.log(email);

    

    

    const generatedCode = await validateUser.validateEmail(email);

    if (generatedCode) {
      return res
        .status(202)
        .json({ message: "Email enviado", registered: false });
    }
  }

  static async validateCode(req, res) {
    const {email, code} = req.body;

    const codeOk = await validateUser.validateCode(email, code);

    if (codeOk === true) {
      try {
        const query = `UPDATE usuario SET autenticado WHERE email = ?`;
        connect.query(query, email, (err, results) => {
          if (err) {
            console.log("erro ao tornar o usuário como autenticado", err);
          } else {
            res.status(200).json({
              message: "Código válido. Usuário autenticado.",
              registered: true,
            });
          }
        });
      } catch (error) {}
    } else if (codeOk === "expirado") {
      return res.status(400).json({
        message: "Código expirado. Tente cadastrar-se novamente",
        registered: false,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Código inválido", registered: false });
    }
  }
};
