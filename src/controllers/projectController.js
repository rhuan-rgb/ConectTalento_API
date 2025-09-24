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
        `;
  
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
              imagemBase64 = proj.imagem.toString('base64');
            }
  
            return {
              titulo: proj.titulo,
              total_curtidas: proj.total_curtidas,
              imagem: imagemBase64,
              tipo_imagem: proj.tipo_imagem   
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
              imagemBase64 = proj.imagem.toString('base64');
            }
  
            return {
              titulo: proj.titulo,
              total_curtidas: proj.total_curtidas,
              imagem: imagemBase64,
              tipo_imagem: proj.tipo_imagem   
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
          imagens: results.map((proj) => {
            if (proj.imagem && Buffer.isBuffer(proj.imagem)) {
              return {
                imagem: proj.imagem.toString("base64"),
                tipo_imagem: proj.tipo_imagem,
                ID_imagem: proj.ID_projeto,
                ordem: proj.ordem
              };
            }
            return null;
          }).filter(Boolean),
        };
  
        return res.status(200).json({ projeto });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

   // UPDATE
   static async updateProject(req, res) {
    const  id_projeto  = req.params.id;
    const { titulo, descricao, imagens} = req.body;

    if (!id_projeto || !titulo || !descricao) {
      return res
        .status(400)
        .json({ error: "ID, título e descrição são obrigatórios" });
    }

    try {
      const query = `UPDATE projeto SET titulo = ?, descricao = ? WHERE ID_projeto = ?`;
      connect.query(query, [titulo, descricao, id_projeto], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao atualizar projeto" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Projeto não encontrado" });
        }

        return res
          .status(200)
          .json({ message: "Projeto atualizado com sucesso" });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
    if(imagens){
      let img_banco;
      let imagem_update_res = []
      let imagem_insert_res = []
      try{
        imagens.forEach((img) =>{
          let query = `SELECT * FROM imagens WHERE ID_imagem = ?;`
          connect.query(query, [img.ID_imagem], (err, results)=>{
            if(err){
              return res.status(400).json({error: "erro ao encontrar imagem: ", err})
            }
            if(results.lenght > 0){
              if(results.ordem !== img.ordem){
                query = `UPDATE imagem SET ordem = ? WHERE ID_imagem = ?;`
                connect.query(query, [img.ordem, img.ID_imagem], (err, results) =>{
                  if(err){
                    return res.status(400).json({error: "erro ao atualizar a ordem da imagem: ", err})
                  }
                  // retorna o relatório de cada imagem alterada.
                  imagem_update_res.push({ID_imagem: img.ID_imagem, info: results.info});
                })
              }
            } else {
              query = `INSERT INTO imagem (imagem, tipo_imagem, ordem, ID_projeto) VALUES (?, ?, ?, ?)`
              connect.query(query, [img.imagem, img.tipo_imagem, img.ordem, img.ID_projeto], (err, results) =>{
                if(err){
                  return res.status(400).json({error:"erro ao inserir imagem no banco: ", err})
                }
                imagem_insert_res.push({info: results.info});
              })
            }
          })
        })
      } catch {

      }
    }
  }

  // DELETE
  static async deleteProject(req, res) {
    const id  = req.params.id;

    if (!id) return res.status(400).json({ error: "ID é obrigatório" });

    try {
      const query = `DELETE FROM projeto WHERE ID_projeto = ?`;
      connect.query(query, [id], (err, result) => {
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
  
};
