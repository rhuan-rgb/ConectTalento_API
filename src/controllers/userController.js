const connect = require("../db/connect");
const jwt = require("jsonwebtoken");
const validateUser = require("../services/validateUser");
const bcrypt = require("bcrypt");
const { MercadoPagoConfig, Payment } = require("mercadopago");

module.exports = class userController {
  static async createUser(req, res) {
    const { email, password, confirmPassword, username, name, code } = req.body;

    // ===== Verificações simples =====
    if (!email || !password || !confirmPassword || !username || !name) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "As senhas não coincidem" });
    }
    if (!validateUser.validateDataEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (await validateUser.checkIfEmailCadastrado(email)) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }
    if (await validateUser.validateUserName(username)) {
      return res.status(400).json({ error: "Usuário já com esse username" });
    }

    if (code) {
      const codeOk = await validateUser.validateCode(email, code); // valida se o codigo é valido ou não

      if (codeOk === true) {
        try {
          // pega o usuário para ter o ID_user e montar o token
          const querySelectUser =
            "SELECT ID_user, email, username, name, plano, criado_em FROM usuario WHERE email = ? LIMIT 1";
          connect.query(querySelectUser, [email], (err, rows) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Erro ao buscar usuário.", err });
            }
            if (!rows.length) {
              return res.status(404).json({ error: "Usuário não encontrado." });
            }

            const user = rows[0];

            // autentica o usuário
            const queryUpdate =
              "UPDATE usuario SET autenticado = true WHERE ID_user = ? LIMIT 1";
            connect.query(queryUpdate, [user.ID_user], (err2) => {
              if (err2) {
                return res
                  .status(500)
                  .json({ error: "Erro ao autenticar usuário.", err: err2 });
              }

              const queryExtrainfo =
                "INSERT INTO extrainfo (link_insta, link_facebook, link_github, link_pinterest, numero_telefone, ID_user) VALUES (null, null, null, null, null, ?);";
              connect.query(queryExtrainfo, [user.ID_user], (err3) => {
                if (err3) {
                  return res.status(500).json({
                    error: "Erro ao inserir informações extra para o usuário.",
                    err: err3,
                  });
                }

                // gera JWT
                const token = jwt.sign(
                  { ID_user: user.ID_user },
                  process.env.SECRET,
                  { expiresIn: "1h" }
                );

                return res.status(200).json({
                  message: "Código válido. Usuário autenticado.",
                  user: { ...user, autenticado: true },
                  token,
                });
              });
            });
          });
        } catch (error) {
          return res
            .status(500)
            .json({ error: "Erro interno do servidor.", error });
        }
      } else if (codeOk === "expirado") {
        return res.status(400).json({
          error: "Código expirado. Tente cadastrar-se novamente.",
        });
      } else {
        return res.status(400).json({ error: "Código inválido." });
      }
    } else {
      try {
        // ===== 1) Existe pré-cadastro (não autenticado) =====
        const userExiste = await validateUser.checkIfEmailExiste(email);

        if (userExiste) {
          const ID_user = userExiste[0].ID_user;
          const generatedCode = await validateUser.sendCodeToEmail(
            email,
            ID_user
          );
          if (!generatedCode) {
            return res
              .status(500)
              .json({ error: "Falha ao enviar o código. Tente novamente." });
          }

          return res.status(202).json({
            message: "Código reenviado ao e-mail.",
          });
        }

        // ===== 2) Não existe → cria pré-cadastro (autenticado=false) =====
        const hashedPassword = await validateUser.hashPassword(password);
        const insertSql =
          "INSERT INTO usuario (email, senha, username, name, autenticado, criado_em, plano) VALUES (?, ?, ?, ?, false, NOW(), false)";

        connect.query(
          insertSql,
          [email, hashedPassword, username, name],
          async (err, result) => {
            if (err) {
              if (
                err.code == "ER_DUP_ENTRY" &&
                err.sqlMessage.includes("'usuario.username'")
              ) {
                return res
                  .status(500)
                  .json({ error: "username já existe", detail: err });
              }
              return res
                .status(500)
                .json({ error: "Erro interno do servidor", err });
            }

            const ID_user = result.insertId;
            const generatedCode = await validateUser.sendCodeToEmail(
              email,
              ID_user
            );
            if (!generatedCode) {
              return res
                .status(500)
                .json({ error: "Falha ao enviar o código. Tente novamente." });
            }

            return res
              .status(201)
              .json({ message: "Código enviado ao e-mail." });
          }
        );
      } catch (error) {
        return res
          .status(500)
          .json({ error: "Erro interno do servidor", detail: error });
      }
    }
  }

  static async forgotPassword(req, res) {
    const { email, password, confirmPassword, code, atualizar } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ error: "O e-mail deve ser passado para o envio do código." });
    }

    if (!validateUser.validateDataEmail(email)) {
      return res.status(400).json({ error: "E-mail inválido" });
    }

    if (!(await validateUser.checkIfEmailCadastrado(email))) {
      return res.status(400).json({ error: "E-mail ainda não cadastrado" });
    }

    try {
      // Se não enviou código, gera e envia
      if (!code) {
        const [user] = await new Promise((resolve, reject) => {
          connect.query(
            "SELECT ID_user FROM usuario WHERE email = ? LIMIT 1",
            [email],
            (err, results) => {
              if (err) return reject(err);
              resolve(results);
            }
          );
        });

        if (!user) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const userId = user.ID_user;

        const generatedCode = await validateUser.sendCodeToEmail(email, userId);

        if (!generatedCode) {
          return res
            .status(500)
            .json({ error: "Falha ao enviar o código. Tente novamente." });
        }

        return res.status(201).json({ message: "Código enviado ao e-mail." });
      }

      // Se enviou código, valida e atualiza senha se necessário
      if (code) {
        const codeOk = await validateUser.validateCode(email, code);

        if (codeOk === true) {
          if (!atualizar) {
            return res.status(200).json({ message: "Código válido." });
          }

          if (atualizar) {
            if (!password || !confirmPassword) {
              return res
                .status(400)
                .json({ error: "Preencha todos os campos de senha." });
            }

            if (password !== confirmPassword) {
              return res
                .status(400)
                .json({ error: "As senhas não coincidem." });
            }

            // Busca ID do usuário
            const [user] = await new Promise((resolve, reject) => {
              connect.query(
                "SELECT ID_user FROM usuario WHERE email = ? LIMIT 1",
                [email],
                (err, results) => {
                  if (err) return reject(err);
                  resolve(results);
                }
              );
            });

            if (!user) {
              return res.status(404).json({ error: "Usuário não encontrado" });
            }

            const userId = user.ID_user;

            const novaSenhaHash = await validateUser.hashPassword(password);

            await new Promise((resolve, reject) => {
              connect.query(
                "UPDATE usuario SET senha = ? WHERE ID_user = ?",
                [novaSenhaHash, userId],
                (err, result) => {
                  if (err) return reject(err);
                  if (result.affectedRows === 0) {
                    return reject(new Error("Usuário não encontrado"));
                  }
                  resolve(result);
                }
              );
            });

            return res
              .status(200)
              .json({ message: "Senha atualizada com sucesso" });
          }
        } else if (codeOk === "expirado") {
          return res.status(400).json({
            error: "Tempo expirado. Tente reenviar o código novamente.",
          });
        } else {
          return res
            .status(400)
            .json({ error: "Código inválido. Tente novamente." });
        }
      }
    } catch (error) {
      console.error("Erro na função forgotPassword:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
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
    const query = `SELECT * FROM usuario`;

    try {
      connect.query(query, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro Interno do Servidor" });
        }

        // Converte imagem binária em base64 para cada usuário
        const users = results.map((user) => {
          let imagemBase64 = null;
          if (user.imagem && Buffer.isBuffer(user.imagem)) {
            imagemBase64 = user.imagem.toString("base64");
          }

          return {
            ID_user: user.ID_user,
            email: user.email,
            autenticado: user.autenticado,
            biografia: user.biografia,
            username: user.username,
            name: user.name,
            plano: user.plano,
            criado_em: user.criado_em,
            imagem: imagemBase64,
            tipo_imagem: user.tipo_imagem,
          };
        });

        return res.status(200).json({
          message: "Mostrando usuários:",
          users,
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Um erro foi encontrado." });
    }
  }

  static async getUserByName(req, res) {
    const userName = req.params.user;

    if (!userName || typeof userName !== "string" || !userName.trim()) {
      return res.status(400).send("Usuário inválido.");
    }

    const sql = `
    SELECT
      u.name,
      u.username,
      u.email,
      u.biografia,
      u.imagem,
      u.tipo_imagem,
      u.plano,
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
        return res.status(500).json({ error: "Erro Interno do Servidor" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Perfil não encontrado." });
      }

      const user = results[0];

      let imagemBase64 = null;
      if (user.imagem && Buffer.isBuffer(user.imagem)) {
        imagemBase64 = user.imagem.toString("base64");
      }

      const profile = {
        name: user.name,
        username: user.username,
        email: user.email,
        biografia: user.biografia,
        imagem: imagemBase64,
        tipo_imagem: user.tipo_imagem,
        plano: user.plano,
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

  static async getUserById(req, res) {
    const userID = req.params.id;

    if (!userID) {
      return res.status(400).send("Todos os campos devem ser preenchidos");
    }

    const sql = `
    SELECT
      u.name,
      u.username,
      u.email,
      u.biografia,
      u.imagem,
      u.tipo_imagem,
      u.plano,
      e.link_insta,
      e.link_facebook,
      e.link_github,
      e.link_pinterest,
      e.numero_telefone
    FROM usuario u
    LEFT JOIN extrainfo e
      ON e.ID_user = u.ID_user
    WHERE u.ID_user = ?
    ORDER BY e.ID_extrainfo DESC
    LIMIT 1;
  `;

    connect.query(sql, [userID], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro Interno do Servidor" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Perfil não encontrado." });
      }

      const user = results[0];

      let imagemBase64 = null;
      if (user.imagem && Buffer.isBuffer(user.imagem)) {
        imagemBase64 = user.imagem.toString("base64");
      }

      const profile = {
        name: user.name,
        username: user.username,
        email: user.email,
        biografia: user.biografia,
        imagem: imagemBase64,
        tipo_imagem: user.tipo_imagem,
        plano: user.plano,
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
    const userId = String(req.params.id);
    const idCorreto = String(req.userId);
    const arquivo = req.files;
    const { email, biografia, username_, name, code } = req.body;

    if (idCorreto !== userId) {
      return res
        .status(400)
        .json({ error: "Você não tem permissão de atualizar essa conta." });
    }
    if (!email || !biografia || !username_ || !name) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios." });
    }
    if (!validateUser.validateDataEmail(email)) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (arquivo?.length > 1) {
      return res.status(400).json({ error: "Coloque somente uma imagem" });
    }

    const username = username_.trim();

    const tipo_imagem = arquivo?.[0]?.mimetype ?? null;
    const imagem = arquivo?.[0]?.buffer ?? null;

    try {
      // Carrega valores atuais do usuário
      const selectQuery =
        "SELECT email, username FROM usuario WHERE ID_user = ? LIMIT 1";
      const current = await new Promise((resolve, reject) => {
        connect.query(selectQuery, [userId], (err, rows) => {
          if (err) return reject(err);
          resolve(rows && rows[0] ? rows[0] : null);
        });
      });
      if (!current) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      // Se o email mudou, checa duplicidade excluindo o próprio ID
      if (email !== current.email) {
        const emailJaExiste = await validateUser.checkIfEmailCadastrado(email);
        if (emailJaExiste) {
          return res
            .status(400)
            .json({ error: "Email já cadastrado por outro usuário" });
        }
      }
      if (username !== current.username) {
        const usernameJaExiste = await validateUser.validateUserName(username);
        if (usernameJaExiste) {
          return res
            .status(400)
            .json({ error: "Usuário já com esse username" });
        }
      }

      //se o email for mudado, deve-se verificá-lo com um código
      if (email !== current.email) {
        if (!code) {
          const generatedCode = await validateUser.sendCodeToEmail(
            email,
            userId
          );
          if (!generatedCode) {
            return res
              .status(500)
              .json({ error: "Falha ao enviar o código. Tente novamente." });
          }

          return res.status(202).json({
            message: "Código enviado ao email.",
          });
        } 
          const codeOk = await validateUser.validateCode(current.email, code); // valida se o codigo é valido ou não
          if (codeOk) {
            const query = `UPDATE usuario SET email=?, username=?, name=?, biografia=?, imagem= ?, tipo_imagem=? WHERE ID_user = ?`;
            const values = [
              email,
              username,
              name,
              biografia,
              imagem,
              tipo_imagem,
              userId,
            ];

            connect.query(query, values, function (err, results) {
              if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                  return res
                    .status(400)
                    .json({ error: "E-mail já cadastrado por outro usuário." });
                }
                console.error(err);
                return res
                  .status(500)
                  .json({ error: "Erro Interno do Servidor" });
              }
              if (results.affectedRows === 0) {
                return res
                  .status(404)
                  .json({ error: "Usuário não encontrado." });
              }
              return res
                .status(200)
                .json({ message: "Usuário atualizado com sucesso." });
            });
            return
        } else if (codeOk === "expirado") {
          return res.status(400).json({
            error: "Código expirado. Tente cadastrar-se novamente.",
          });
        } else {
          console.log(codeOk);
          return res.status(400).json({ error: "Código inválido." });
        }
      } else {
        const query = `UPDATE usuario SET email=?, username=?, name=?, biografia=?, imagem= ?, tipo_imagem=? WHERE ID_user = ?`;
            const values = [
              email,
              username,
              name,
              biografia,
              imagem,
              tipo_imagem,
              userId,
            ];

            connect.query(query, values, function (err, results) {
              if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                  return res
                    .status(400)
                    .json({ error: "E-mail já cadastrado por outro usuário." });
                }
                console.error(err);
                return res
                  .status(500)
                  .json({ error: "Erro Interno do Servidor" });
              }
              if (results.affectedRows === 0) {
                return res
                  .status(404)
                  .json({ error: "Usuário não encontrado." });
              }
              return res
                .status(200)
                .json({ message: "Usuário atualizado com sucesso." });
            });
            return
      }
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro Interno de Servidor" });
    }
  }

  static async updatePassword(req, res) {
    const userId = String(req.params.id);
    const idCorreto = String(req.userId);
    const { senha_atual, nova_senha } = req.body;

    if (idCorreto !== userId) {
      return res
        .status(400)
        .json({ error: "Você não tem permissão de atualizar essa conta." });
    }
    if (senha_atual === nova_senha) {
      return res.status(400).json({ error: "As senhas são iguais" });
    }
    if (!senha_atual || !nova_senha) {
      return res
        .status(400)
        .json({ error: "Informe sua senha atual e sua nova senha" });
    }

    try {
      const querySelect = "SELECT senha FROM usuario WHERE ID_user = ?";
      connect.query(querySelect, [userId], async (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar usuário" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const senhaHashAtual = results[0].senha;

        // Verifica se a senha atual está correta
        const senhaCorreta = await bcrypt.compare(senha_atual, senhaHashAtual);
        if (!senhaCorreta) {
          return res.status(401).json({ error: "Senha atual incorreta" });
        }

        // Gera hash da nova senha
        const novaSenhaHash = await validateUser.hashPassword(nova_senha);

        // Atualiza a senha no banco
        const queryUpdate = "UPDATE usuario SET senha = ? WHERE ID_user = ?";
        connect.query(queryUpdate, [novaSenhaHash, userId], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao atualizar a senha" });
          }
          return res
            .status(200)
            .json({ message: "Senha atualizada com sucesso" });
        });
      });
    } catch (error) {
      console.error("Erro ao atualizar a senha:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deleteUser(req, res) {
    const userId = String(req.params.id);
    const idCorreto = String(req.userId);

    if (idCorreto !== userId) {
      return res
        .status(400)
        .json({ error: "Você não tem permissão de apagar essa conta." });
    }

    const query = `DELETE FROM usuario WHERE ID_user = ?`;
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

  static async paymentUserPix(req, res) {
    const userId = String(req.params.id);
    const idCorreto = String(req.userId);
    const { email } = req.body;

    if (idCorreto !== userId) {
      return res.status(400).json({
        error: "Você não tem permissão de pagar um plano nessa conta.",
      });
    }
    if (!email) {
      return res.status(400).json({ error: "Email do pagador é obrigatório." });
    }

    try {
      // 1) Configura o cliente do Mercado Pago com seu ACCESS_TOKEN (mantido no backend/.env)
      const mpClient = new MercadoPagoConfig({
        accessToken: process.env.ACCESS_TOKEN,
        options: { timeout: 5000 },
      });

      // 2) Instancia a Payments API (diferente de Order)
      const paymentsApi = new Payment(mpClient);

      // 3) Referência curta para conciliar (<= 64 chars, sem espaços/acentos)
      const externalReference = `plano_${userId}_${Date.now()}`
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 64);

      // 4) Body da Payments API (ATENÇÃO: aqui amount é number e os campos têm outros nomes)
      const paymentBody = {
        transaction_amount: 0.01, // number na Payments API
        description: `Plano user:${userId}`, // descrição livre
        payment_method_id: "pix", // PIX direto
        payer: { email }, // e-mail do pagador (cliente)
        external_reference: externalReference, // sua referência para conciliação
      };

      // 5) Idempotência para evitar duplicidade
      const requestOptions = {
        idempotencyKey: `pixpay-${userId}-${Date.now()}`,
      };

      // 6) Cria o pagamento PIX — a resposta já traz o QR
      const pay = await paymentsApi.create({
        body: paymentBody,
        requestOptions,
      });

      // 7) Extrai o QR (copia e cola + imagem base64) do payment
      const tx = pay?.point_of_interaction?.transaction_data || {};

      return res.status(201).json({
        ok: true,
        payment_id: pay?.id, // este é o ID numérico do Payment
        status: pay?.status || "pending",
        amount: pay?.transaction_amount || 0.01,
        qr_code: tx.qr_code || null, // copia e cola
        qr_code_base64: tx.qr_code_base64 || null,
        ticket_url: tx.ticket_url || null, // link do MP
      });
    } catch (error) {
      console.error("MP PAYMENT ERROR:", error?.response?.data || error);
      return res.status(500).json({ error: "Erro ao criar pagamento PIX." });
    }
  }

  static async getPaymentPixStatus(req, res) {
    const { id, paymentId } = req.params;
    const idCorreto = String(req.userId);
    const userId = String(id);
    const mpPaymentId = String(paymentId || "").trim();

    if (idCorreto !== userId) {
      return res
        .status(400)
        .json({ error: "Você não tem permissão de consultar este pagamento." });
    }
    if (!mpPaymentId) {
      return res.status(400).json({ error: "paymentId é obrigatório." });
    }

    try {
      const mpClient = new MercadoPagoConfig({
        accessToken: process.env.ACCESS_TOKEN,
        options: { timeout: 5000 },
      });

      const paymentsApi = new Payment(mpClient);
      const pay = await paymentsApi.get({ id: mpPaymentId });

      const status = pay?.status; // 'approved', 'pending', 'rejected', ...
      const tx = pay?.point_of_interaction?.transaction_data || {};

      // Se aprovado, ativa o plano
      if (status === "approved") {
        const q = "UPDATE usuario SET plano = TRUE WHERE ID_user = ? LIMIT 1";
        connect.query(q, [idCorreto], (err) => {
          if (err) {
            console.error(err);
            return res.status(200).json({
              payment_id: mpPaymentId,
              status,
              updated: false,
              amount: pay?.transaction_amount,
            });
          }
          return res.status(200).json({
            payment_id: mpPaymentId,
            status,
            updated: true,
            amount: pay?.transaction_amount,
          });
        });
        return;
      }

      // Para pending/rejected/cancelled/expired/...
      return res.status(200).json({
        payment_id: mpPaymentId,
        status: status || "unknown",
        amount: pay?.transaction_amount,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Erro ao consultar status do pagamento PIX." });
    }
  }
};
