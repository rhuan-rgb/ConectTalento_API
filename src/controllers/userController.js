const connect = require("../db/connect");
const jwt = require("jsonwebtoken");
const validateUser = require("../services/validateUser");

module.exports = class userController {
  static async createUser(req, res) {
    const { email, password, confirmPassword, username } = req.body;

    // ===== 1) Verificações simples =====
    if (!email || !password || !confirmPassword || !username) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "As senhas não coincidem" });
    }
    if (!validateUser.validateDataEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }

    try {
      // Já existe usuário autenticado?
      const emailCadastrado = await validateUser.checkIfEmailCadastrado(email);
      if (emailCadastrado) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // ===== 2) Existe pré-cadastro (não autenticado)? =====
      const emailExiste = await validateUser.checkIfEmailExiste(email);

      if (emailExiste) {
        const generatedCode = await validateUser.sendCodeToEmail(email);
        if (!generatedCode) {
          return res.status(500).json({ error: "Falha ao enviar o código. Tente novamente." });
        }

        return res.status(202).json({
          message: "Código reenviado ao e-mail.",
        });
      }

      // ===== 3) Não existe → cria pré-cadastro (autenticado=false) =====
      const hashedPassword = await validateUser.hashPassword(password);
      const insertSql =
        "INSERT INTO usuario (email, senha, username, autenticado, criado_em, plano) VALUES (?, ?, ?, false, NOW(), false)";

      connect.query(insertSql, [email, hashedPassword, username], async (err) => {
        if (err) {
          return res.status(500).json({ error: "Erro interno do servidor", err });
        }

        // envia código
        const generatedCode = await validateUser.sendCodeToEmail(email);
        return res.status(201).json({
          message: "Código enviado ao e-mail.",
        });
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro interno do servidor", detail: error });
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
        const senhaValida = await validateUser.comparePassword(password, user.senha);

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
    const query = `SELECT ID_user, email, autenticado, biografia, plano, username FROM usuario`;

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

  static async getUserByName(req, res) {
    const userName = req.params.user;

    if (!userName) {
      return res.status(400).send("Usuário inválido.");
    }

    const sql = `
    SELECT
      u.username,
      u.email,
      u.biografia,
      u.imagem_user,
      e.link_insta,
      e.link_facebook,
      e.link_github,
      e.link_pinterest,
      e.numero_telefone
    FROM usuario u
    LEFT JOIN extrainfo e ON e.ID_user = u.ID_user
    WHERE u.username = ?
    ORDER BY e.ID_extrainfo DESC
    LIMIT 1
  `;

    connect.query(sql, [userName], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro no servidor.");
      }
      if (results.length === 0) {
        return res.status(404).send("Perfil não encontrado.");
      }

      const user = results[0];
      const profile = {
        username: user.username,
        email: user.email,
        biografia: user.biografia,
        imagem_user: user.imagem_user,
        extrainfo: {
          link_insta: user.link_insta || null,
          link_facebook: user.link_facebook || null,
          link_github: user.link_github || null,
          link_pinterest: user.link_pinterest || null,
          numero_telefone: user.numero_telefone || null,
        },
      };

      return res.status(200).json({ profile });
    });
  }

  static async updateUser(req, res) {
    const { ID_user, email, biografia, password, confirmPassword, username } = req.body;

    // Verifica se as senhas coincidem
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "As senhas não coincidem" });
    }
    if (!ID_user || !email || !password || !confirmPassword || !username) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    const query = `UPDATE usuario SET username=?, email=?, senha=?, biografia=? WHERE ID_user = ?`;
    const values = [
      username,
      email,
      password,
      biografia,
      ID_user,
    ];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              error: "E-mail já cadastrados por outro usuário.",
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

  static async validateCode(req, res) {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: "Código é obrigatório" });
    }

    const codeOk = await validateUser.validateCode(email, code);

    if (codeOk === true) {
      try {
        // pega o usuário para ter o ID_user e montar o token
        const qSelectUser = "SELECT ID_user, email, username, plano, criado_em FROM usuario WHERE email = ? LIMIT 1";
        connect.query(qSelectUser, [email], (err, rows) => {
          if (err) {
            return res.status(500).json({ message: "Erro ao buscar usuário.", err });
          }
          if (!rows.length) {
            return res.status(404).json({ message: "Usuário não encontrado." });
          }

          const user = rows[0];

          // autentica o usuário
          const qUpdate = "UPDATE usuario SET autenticado = true WHERE ID_user = ? LIMIT 1";
          connect.query(qUpdate, [user.ID_user], (err2) => {
            if (err2) {
              return res.status(500).json({ message: "Erro ao autenticar usuário.", err: err2 });
            }

            // gera JWT
            const token = jwt.sign({ ID_user: user.ID_user }, process.env.SECRET, { expiresIn: "1h" });

            return res.status(200).json({
              message: "Código válido. Usuário autenticado.",
              user: { ...user, autenticado: true }, // não retorna senha
              token,
            });
          });
        });
      } catch (error) {
        return res.status(500).json({ message: "Erro interno do servidor.", error });
      }
    } else if (codeOk === "expirado") {
      return res.status(400).json({
        message: "Código expirado. Tente cadastrar-se novamente.",
      });
    } else {
      return res.status(400).json({ message: "Código inválido." });
    }
  }
};
