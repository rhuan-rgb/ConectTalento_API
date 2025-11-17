const connect = require("../db/connect");
const validateProject = require("../services/validateProject");

module.exports = class projectController {
  // CREATE
  static async createProject(req, res) {
    const { ID_user } = req.params;
    const { titulo, descricao } = req.body;
    const imagens = req.files;

    if (!titulo || !descricao || !imagens) {
      return res.status(400).json({
        error: "Todos os campos devem ser preenchidos",
      });
    }

    if (await validateProject.validateProjectUserLength(ID_user)) {
      return res
        .status(400)
        .json({ error: "Usuário já excedeu o limite de projetos" });
    }

    const isPremium = await validateProject.validateProjectUserPlano(ID_user);

    if (imagens.length === 0) {
      return res.status(400).json({ error: "Coloque no mínimo uma imagem" });
    }

    if (isPremium) {
      if (imagens.length > 5) {
        return res
          .status(400)
          .json({ error: "Você só pode inserir 5 imagens por projeto." });
      }
    }

    if (!isPremium) {
      if (imagens.length > 3) {
        return res.status(400).json({
          error:
            "Limite de apenas 3 imagens. Assine o plano premium para inserir mais.",
        });
      }
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

  // UPDATE
  static async updateProject(req, res) {
    const ID_projeto = req.params.id;
    const { titulo, descricao } = req.body;
    const imagens = req.files;
    const idCorreto = Number(req.userId);
    const ID_user = Number(req.body.ID_user);

    if (idCorreto !== ID_user) {
      return res
        .status(400)
        .json({ error: "Você não tem permissão de atualizar esse projeto." });
    }

    if (!ID_user || !titulo || !descricao || !ID_projeto || !imagens) {
      return res.status(400).json({
        error: "Todos os campos devem ser preenchidos",
      });
    }

    if (imagens) {
      if (imagens.length === 0) {
        return res.status(400).json({
          error: "Pelo menos uma imagem deve ser enviada.",
        });
      }

      const isPremium = await validateProject.validateProjectUserPlano(ID_user);

      if (isPremium && imagens.length > 5) {
        return res
          .status(400)
          .json({ error: "Você só pode inserir 5 imagens por projeto." });
      }

      if (!isPremium && imagens.length > 3) {
        return res.status(400).json({
          error:
            "Limite de apenas 3 imagens. Assine o plano premium para inserir mais.",
        });
      }
    }

    try {
      const queryCheck = `SELECT 1 FROM projeto WHERE ID_projeto = ? AND ID_user = ? LIMIT 1`;
      connect.query(queryCheck, [ID_projeto, ID_user], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao atualizar projeto" });
        }
        if (!result || result.length === 0) {
          return res.status(403).json({
            error: "Você não tem permissão para atualizar esse projeto.",
          });
        }

        try {
          const queryUpdateProject = `UPDATE projeto SET titulo = ?, descricao = ? WHERE ID_projeto = ?`;
          connect.query(
            queryUpdateProject,
            [titulo, descricao, ID_projeto],
            (err, result) => {
              if (err) {
                console.error(err);
                return res
                  .status(500)
                  .json({ error: "Erro ao atualizar projeto" });
              }
              if (result.affectedRows === 0) {
                return res
                  .status(404)
                  .json({ error: "Projeto não encontrado" });
              }

              const promises = imagens.map((img, index) => {
                const ordem = index + 1;
                const tipoImagem = img.mimetype;
                const buffer = img.buffer;

                const queryUpdateImagem = `
                UPDATE imagens
                   SET imagem = ?, tipo_imagem = ?, ordem = ?
                 WHERE ID_projeto = ? AND ordem = ?
              `;

                return new Promise((resolve, reject) => {
                  connect.query(
                    queryUpdateImagem,
                    [buffer, tipoImagem, ordem, ID_projeto, ordem],
                    (err, updateResult) => {
                      if (err) {
                        console.error("Erro ao atualizar imagem:", err);
                        return reject(err);
                      }

                      if (updateResult.affectedRows > 0) {
                        return resolve();
                      }

                      // Se não havia linha nessa ordem, insere
                      const queryInsertImagem = `
                      INSERT INTO imagens (imagem, tipo_imagem, ordem, ID_projeto)
                      VALUES (?, ?, ?, ?)
                    `;
                      connect.query(
                        queryInsertImagem,
                        [buffer, tipoImagem, ordem, ID_projeto],
                        (err, insertResult) => {
                          if (err) {
                            console.error("Erro ao inserir imagem:", err);
                            return reject(err);
                          }
                          if (
                            !insertResult ||
                            insertResult.affectedRows === 0
                          ) {
                            return reject(new Error("Falha ao salvar imagem."));
                          }
                          return resolve();
                        }
                      );
                    }
                  );
                });
              });

              Promise.all(promises)
                .then(() => {
                  // 🔴 Aqui está a correção para o seu caso:
                  // remove imagens excedentes quando o usuário enviou menos do que existia
                  const novoTotal = imagens.length;
                  const deleteQuery = `
                  DELETE FROM imagens
                   WHERE ID_projeto = ?
                     AND ordem > ?
                `;
                  connect.query(deleteQuery, [ID_projeto, novoTotal], (err) => {
                    if (err) {
                      console.error("Erro ao remover imagens antigas:", err);
                      return res
                        .status(500)
                        .json({ error: "Erro ao remover imagens antigas." });
                    }

                    return res.status(200).json({
                      message: "Projeto atualizado com sucesso!",
                      ID_projeto,
                    });
                  });
                })
                .catch((error) => {
                  console.error("Erro ao salvar imagens:", error);
                  return res
                    .status(500)
                    .json({ error: "Erro ao salvar as imagens." });
                });
            }
          );
        } catch (error) {
          console.error(error);
          return res.status(500).json({ error: "Erro no servidor" });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
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
            ON p.ID_projeto = i.ID_projeto AND i.ordem = 1
          ORDER BY p.criado_em DESC;
        `;

      connect.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro no servidor" });
        }
        if (!results || results.length === 0) {
          return res.status(200).json({ error: "Projetos não encontrados." });
        }

        const listaProjetos = results.map((proj) => {
          let imagemBase64 = null;
          if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
            imagemBase64 = proj.imagem.toString("base64");
          }

          return {
            ID_projeto: proj.ID_projeto,
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

  static async getProjectsByUserName(req, res) {
    const userName = req.params.user;

    if (!userName) {
      return res.status(404).json({ error: "Usuário inválido." });
    }

    try {
      const queryID = `SELECT ID_user FROM usuario u WHERE u.username = ? LIMIT 1`;
      connect.query(queryID, [userName], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro no servidor" });
        }
        if (!result || result.length === 0) {
          return res.status(404).json({ error: "Usuário não encontrado." });
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
            return res.status(500).json({ error: "Erro no servidor" });
          }
          if (!results || results.length === 0) {
            return res.status(200).json({ error: "Projetos não encontrados." });
          }

          const listaProjetos = results.map((proj) => {
            let imagemBase64 = null;
            if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
              imagemBase64 = proj.imagem.toString("base64");
            }

            return {
              ID_projeto: proj.ID_projeto,
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

  static async getProjectsLikedUser(req, res) {
    const ID_user = req.params.ID_user;

    if (!ID_user) {
      return res.status(400).json({ error: "Usuário inválido." });
    }

    try {
      const query = `
         SELECT
          c.ID_curtida,
          p.ID_projeto,
          p.titulo,
          p.total_curtidas,
          i.ID_imagem,
          i.ordem,
          i.tipo_imagem,
          i.imagem
        FROM curtidas c
        JOIN projeto  p ON p.ID_projeto = c.ID_projeto
        JOIN imagens  i ON i.ID_projeto = p.ID_projeto AND i.ordem = 1
        JOIN usuario  u ON u.ID_user = p.ID_user
        WHERE c.ID_user = ?;`;

      connect.query(query, [ID_user], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro no servidor" });
        }
        if (!results || results.length === 0) {
          return res.status(404).json({ error: "Projetos não encontrados." });
        }

        const listaProjetos = results.map((proj) => {
          let imagemBase64 = null;
          if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
            imagemBase64 = proj.imagem.toString("base64");
          }

          return {
            ID_projeto: proj.ID_projeto,
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
      return res.status(400).json({ error: "ID do projeto não foi fornecido" });
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
          u.username,
          u.name AS autor_nome,
          u.imagem AS autor_imagem,
          u.tipo_imagem AS autor_tipo_imagem
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
          return res.status(500).json({ error: "Erro no servidor" });
        }
        if (!results) {
          return res.status(404).json({ error: "Projeto não encontrado." });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: "Projeto não encontrado." });
        }

        const projetodetail = results[0];

        let imagemBase64 = null;
        if (
          projetodetail.autor_imagem &&
          Buffer.isBuffer(projetodetail.autor_imagem)
        ) {
          imagemBase64 = projetodetail.autor_imagem.toString("base64");
        }

        const projeto = {
          ID_projeto: projetodetail.ID_projeto,
          titulo: projetodetail.titulo,
          descricao: projetodetail.descricao,
          total_curtidas: projetodetail.total_curtidas,
          autor: {
            nome: projetodetail.autor_nome,
            username: projetodetail.username,
            imagem: imagemBase64,
            tipo_imagem: projetodetail.autor_tipo_imagem,
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

  // DELETE
  static async deleteProject(req, res) {
    const ID_projeto = req.params.ID_projeto;
    const idCorreto = Number(req.userId);
    const ID_user = Number(req.body.ID_user);

    if (idCorreto !== ID_user) {
      return res
        .status(400)
        .json({ error: "Você não tem permissão de apagar essa conta" });
    }

    if (!ID_projeto) return res.status(400).json({ error: "ID é obrigatório" });

    try {
      const query = `DELETE FROM projeto WHERE ID_projeto = ? AND ID_user = ?`;
      connect.query(query, [ID_projeto, idCorreto], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao deletar projeto" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Projeto não encontrado" });
        }

        return res
          .status(200)
          .json({ message: "Projeto deletado com sucesso" });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

  static async like_or_dislike_projects(req, res) {
    const { ID_projeto, ID_user } = req.body;

    let query = `SELECT * FROM curtidas WHERE ID_projeto = ? AND ID_user = ?;`;
    connect.query(query, [ID_projeto, ID_user], (err, results) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: "erro ao buscar em curtidas" });
      }

      if (results.length > 0) {
        // Já existe curtida -> deletar
        query = `DELETE FROM curtidas WHERE ID_projeto = ? AND ID_user = ?;`;
        connect.query(query, [ID_projeto, ID_user], (err, results) => {
          if (err) {
            console.log(err);
            return res.status(400).json({ error: "erro ao deletar a curtida" });
          }
          return res.status(200).json({
            message: "curtida deletada com sucesso.",
            curtido: false,
          });
        });
      } else {
        // Não existe curtida -> inserir
        query = `INSERT INTO curtidas (ID_projeto, ID_user) VALUES (?, ?);`;
        connect.query(query, [ID_projeto, ID_user], (err, results) => {
          if (err) {
            console.log(err);
            return res.status(400).json({ error: "erro ao inserir a curtida" });
          }
          return res.status(200).json({
            message: "curtida inserida com sucesso.",
            curtido: true,
          });
        });
      }
    });
  }

  static async searchProjects(req, res) {
    const search = `%${req.query.q || ""}%`;

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
            ON p.ID_projeto = i.ID_projeto AND i.ordem = 1
          WHERE titulo LIKE ? ORDER BY p.criado_em DESC;
        `;
      console.log("passou aqui");
      connect.query(query, [search], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar projetos" });
        }
        if (!results || results.length === 0) {
          return res.status(200).json({ error: "Projetos não encontrados." });
        }

        const listaProjetos = results.map((proj) => {
          let imagemBase64 = null;
          if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
            imagemBase64 = proj.imagem.toString("base64");
          }

          return {
            ID_projeto: proj.ID_projeto,
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
};
