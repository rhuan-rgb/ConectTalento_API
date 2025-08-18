const connect = require("../db/connect");
const jwt = require("jsonwebtoken");
const validateUser = require("../services/validateUser");

module.exports = class userController {
  static async createUser(req, res) {
    const { email, password, biografia, username, plano } = req.body;

    // Validação dos dados (incluindo CPF)
    const validationError = validateUser(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      // Consulta para inserir o usuário na tabela (adicionando o CPF)
      const query = `INSERT INTO usuario (email, senha, username, biografia, plano) VALUES (?, ?, ?, ?, ?, ?)`;
      connect.query(
        query,
        [email, password, username, biografia, plano], // incluindo CPF aqui
        (err) => {
          if (err) {
            console.log(err);
            if (err.code === "ER_DUP_ENTRY") {
              if (err.message.includes("email")) {
                return res.status(400).json({ error: "Email já cadastrado" });
              }
              if (err.message.includes("cpf")) {
                return res.status(400).json({ error: "CPF já cadastrado" });
              }
            } else {
              return res
                .status(500)
                .json({ error: "Erro interno do servidor", err });
            }
          }
          return res
            .status(201)
            .json({ message: "Usuário criado com sucesso" });
        }
      );
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  static async loginUser(req, res) {
    const { email, password } = req.body;

    // Verificar se o CPF e a senha foram fornecidos
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "O Email e a Senha são obrigatórios para o login!" });
    }

    // Alterar a consulta para buscar pelo email
    const query = `SELECT * FROM usuario WHERE email = ?`;

    try {
      connect.query(query, [email], (err, results) => {
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
        if (user.senha !== password) {
          return res.status(403).json({ error: "Senha Incorreta" });
        }

        // Gerar o token de autenticação
        const token = jwt.sign(
          { id_usuario: user.id_usuario }, // Usar id_usuario no payload do token
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
    const query = `SELECT id_usuario, email, username, biografia, plano FROM usuario`;

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
    const { email, password, id_usuario, biografia, username, plano} =
      req.body;

    // Validação dos dados (incluindo CPF)
    const validationError = validateUser(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const query = `UPDATE usuario SET username=?, email=?, senha=?, biografia=?, plano=? WHERE id_usuario = ?`;
    const values = [
      username,
      email,
      password,
      biografia,
      plano,
      id_usuario,
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

    const query = `DELETE FROM usuario WHERE id_usuario = ?`; // Garante que estamos buscando pelo 'id_usuario'
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
  static async deleteUser(req, res) {
    const userId = req.params.id; // Pega o ID do usuário da URL

    if (!userId) {
      return res.status(400).json({ error: "ID do usuário é necessário" });
    }

    const query = `DELETE FROM usuario WHERE id_usuario = ?`; // Garante que estamos buscando pelo 'id_usuario'
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
};
