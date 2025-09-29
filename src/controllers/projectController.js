const connect = require("../db/connect");

module.exports = class projectController {
  // CREATE
  static async createProject(req, res) {
    const { ID_user } = req.params;
    const { titulo, descricao } = req.body;
    const imagens = req.files;

    if (!titulo || !descricao || !imagens || imagens.length === 0) {
      return res.status(400).json({
        error:
          "Todos os campos devem ser preenchidos e pelo menos uma imagem deve ser enviada.",
      });
    }

    if (imagens.length > 5) {
      return res
        .status(400)
        .json({ error: "Você só pode inserir 5 imagens por projeto." });
    }

    try {
      const queryProjeto = `INSERT INTO projeto (ID_user, titulo, descricao, criado_em) VALUES (?, ?, ?, NOW())`;
      connect.query(
        queryProjeto,
        [ID_user, titulo, descricao],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao criar projeto." });
          }

          const projetoId = result.insertId;

          const promises = imagens.map((img, index) => {
            const ordem = index + 1;
            const tipoImagem = img.mimetype;
            const queryImagem = `INSERT INTO imagens (imagem, tipo_imagem, ID_projeto, ordem) VALUES (?, ?, ?, ?)`;

            return new Promise((resolve, reject) => {
              connect.query(
                queryImagem,
                [img.buffer, tipoImagem, projetoId, ordem],
                (err) => {
                  if (err) {
                    console.error("Erro ao salvar imagem:", err);
                    reject(err);
                  } else {
                    resolve();
                  }
                }
              );
            });
          });

          Promise.all(promises)
            .then(() => {
              return res.status(201).json({
                message: "Projeto criado com sucesso!",
                projetoId,
              });
            })
            .catch((error) => {
              console.error("Erro ao salvar", error);
              return res
                .status(500)
                .json({ error: "Erro ao salvar as imagens." });
            });
        }
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor." });
    }
  }

  static async getAllProjects(req, res) {
    try {
      const query = `
          SELECT 
            p.ID_projeto,
            p.titulo,
            p.total_curtidas,
            i.imagem,
            i.tipo_imagem
          FROM projeto p
          LEFT JOIN imagens i 
            ON p.ID_projeto = i.ID_projeto 
          ORDER BY p.criado_em DESC; 
        `; //mais nova ao mais antigo

      connect.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro no servidor.");
        }
        if (!results || results.length === 0) {
          return res.status(404).send("Projetos não encontrados.");
        }

        const listaProjetos = results.map((proj) => {
          let imagemBase64 = null;
          if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
            imagemBase64 = proj.imagem.toString("base64");
          }

          return {
            titulo: proj.titulo,
            total_curtidas: proj.total_curtidas,
            imagem: imagemBase64,
            tipo_imagem: proj.tipo_imagem,
          };
        });

        return res.status(200).json({ profile_projeto: listaProjetos });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

  static async getProjectByUserName(req, res) {
    const userName = req.params.user;

    if (!userName) {
      return res.status(400).send("Usuário inválido.");
    }

    try {
      const queryID = `SELECT ID_user FROM usuario u WHERE u.username = ? LIMIT 1`;
      connect.query(queryID, [userName], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro no servidor.");
        }
        if (!result || result.length === 0) {
          return res.status(404).send("Usuário não encontrado.");
        }

        const ID_user = result[0].ID_user;

        const query = `
          SELECT 
            p.ID_projeto,
            p.titulo,
            p.total_curtidas,
            i.imagem,
            i.tipo_imagem
          FROM projeto p
          LEFT JOIN imagens i 
            ON p.ID_projeto = i.ID_projeto 
           AND i.ordem = 1
          WHERE p.ID_user = ?
          ORDER BY p.criado_em DESC;
        `;

        connect.query(query, [ID_user], (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Erro no servidor.");
          }
          if (!results || results.length === 0) {
            return res.status(404).send("Projetos não encontrados.");
          }

          const listaProjetos = results.map((proj) => {
            let imagemBase64 = null;
            if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
              imagemBase64 = proj.imagem.toString("base64");
            }

            return {
              titulo: proj.titulo,
              total_curtidas: proj.total_curtidas,
              imagem: imagemBase64,
              tipo_imagem: proj.tipo_imagem,
            };
          });

          return res.status(200).json({ profile_projeto: listaProjetos });
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

  static async getProjectsLikeUser(req, res) {
    const ID_user = req.params;

    if (!ID_user) {
      return res.status(400).send("Usuário inválido.");
    }

    const query = `
         SELECT
          c.ID_curtida,
          p.ID_projeto,
          p.titulo,
          i.ID_imagem,
          i.ordem,
          i.tipo_imagem,
          i.imagem,
        FROM curtidas c
        JOIN projeto  p ON p.ID_projeto = c.ID_projeto
        JOIN imagens  i ON i.ID_projeto = p.ID_projeto AND i.ordem = 1
        JOIN usuario  u ON u.ID_user = p.ID_user
        WHERE c.ID_user = ?;`;

    try {
      connect.query(query, [ID_user], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro no servidor.");
        }
        if (!results || results.length === 0) {
          return res.status(404).send("Projetos não encontrados.");
        }

        const listaProjetos = results.map((proj) => {
          let imagemBase64 = null;
          if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
            imagemBase64 = proj.imagem.toString("base64");
          }

          return {
            titulo: proj.titulo,
            total_curtidas: proj.total_curtidas,
            imagem: imagemBase64,
            tipo_imagem: proj.tipo_imagem,
          };
        });

        return res.status(200).json({ profile_projeto: listaProjetos });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

  // Detalhamento de um projeto
  static async getProject(req, res) {
    const ID_projeto = req.params.ID_projeto;

    if (!ID_projeto) {
      return res.status(400).send("ID do projeto não foi fornecido");
    }

    try {
      const query = `
        SELECT 
          p.ID_projeto,
          p.titulo,
          p.total_curtidas,
          p.descricao,
          i.imagem,
          i.tipo_imagem,
          i.ID_imagem,
          i.ordem,
          u.name AS autor_nome,
          u.imagem AS autor_imagem
        FROM projeto p
        LEFT JOIN imagens i 
          ON p.ID_projeto = i.ID_projeto 
        INNER JOIN usuario u
          ON p.ID_user = u.ID_user
        WHERE p.ID_projeto = ?
      `;

      connect.query(query, [ID_projeto], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Erro no servidor.");
        }
        if (!results || results.length === 0) {
          return res.status(404).send("Projeto não encontrado.");
        }

        const projeto = {
          ID_projeto: results[0].ID_projeto,
          titulo: results[0].titulo,
          descricao: results[0].descricao,
          total_curtidas: results[0].total_curtidas,
          autor: {
            nome: results[0].autor_nome,
            imagem: results[0].autor_imagem
              ? results[0].autor_imagem.toString("base64")
              : null,
          },
          imagens: results
            .map((proj) => {
              if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
                return {
                  imagem: proj.imagem.toString("base64"),
                  tipo_imagem: proj.tipo_imagem,
                  ID_imagem: proj.ID_projeto,
                  ordem: proj.ordem,
                };
              }
              return null;
            })
            .filter(Boolean),
        };

        return res.status(200).json({ projeto });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }
};
