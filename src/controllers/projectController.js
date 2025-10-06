const connect = require("../db/connect"); // Ajuste o caminho da sua conexão

module.exports = class projectController {
  // CREATE
  static async createProject(req, res) {
    const { id_usuario, titulo, descricao } = req.body;

    if (!id_usuario || !titulo || !descricao) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    try {
      const query = `INSERT INTO projeto (id_usuario, titulo, descricao) VALUES (?, ?, ?)`;
      connect.query(query, [id_usuario, titulo, descricao], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao criar projeto" });
        }

        return res.status(201).json({
          message: "Projeto criado com sucesso",
          projetoId: result.insertId,
        });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

  // READ ALL
  static async getAllProjects(req, res) {
    try {
      const query = `SELECT * FROM projeto`;
      connect.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar projetos" });
        }

        return res.status(200).json(results);
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

  static async getAllProjectsOrderByTotalLikes(req, res) {
    try {
      const query = `SELECT * FROM projeto ORDER BY total_curtidas DESC;`;

      connect.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar projetos" });
        }

        return res.status(200).json(results);
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

  // READ ONE
  static async getProjectByIdUser(req, res) {
    const { id_usuario } = req.params.id;

    if (!id_usuario) return res.status(400).json({ error: "ID é obrigatório" });

    try {
      const query = `SELECT * FROM projeto WHERE id_usuario = ?`;
      connect.query(query, [id_usuario], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar projeto" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Projeto não encontrado" });
        }

        return res.status(200).json(results[0]);
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
  static async searchProjects(req, res){
    const search = req.query.q?.toLowerCase() || '';
    try {
      // a correção está no gpt do rhuan09
      const query = `SELECT * FROM projeto WHERE titulo = %?% ASC;`;

      connect.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar projetos" });
        }

        return res.status(200).json(results);
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }
  
};
