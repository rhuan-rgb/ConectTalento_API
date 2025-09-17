
const connect = require("../db/connect"); // Ajuste o caminho da sua conexão

module.exports = class projectController {
  static async createProject(req, res) {
    const { ID_user } = req.params;
    const { titulo, descricao } = req.body;
    const imagens = req.files; // várias imagens
    const imagem_tipo = req.files;

    if (!ID_user || !titulo || !descricao || !imagens || !imagem_tipo) {
      return res
        .status(400)
        .json({
          error:
            "Todos os campos devem ser preenchidos",
        });
    }

    if (imagens.length > 5) {
      return res
        .status(400)
        .json({ error: "Você só pode inserir 5 imagens por projeto" });
    }

    try {
      const queryProjeto = `INSERT INTO projeto (ID_user, titulo, descricao, criado_em) VALUES (?, ?, ?, NOW())`;
      connect.query(
        queryProjeto,
        [ID_user, titulo, descricao],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao criar projeto" });
          }

          const projetoId = result.insertId;

          // Promessas para aguardar a inserção de TODAS as imagens
          const promessas = imagens.map((img, index) => {
            const ordem = index + 1;
            const queryImagem = `
            INSERT INTO imagens (imagem, imagem_tipo, ID_projeto, ordem)
            VALUES (?, ?, ?, ?)
          `;

            const buffer = img.buffer;
            const tipo = img.mimetype;

            const values = [buffer, tipo, projetoId, ordem];

            return new Promise((resolve, reject) => {
              connect.query(queryImagem, values, (err) => {
                if (err) {
                  console.error("Erro ao salvar imagem:", err);
                  return reject(err);
                }
                resolve();
              });
            });
          });

          Promise.all(promessas)
            .then(() => {
              return res.status(201).json({
                message: "Projeto e imagens criados com sucesso",
              });
            })
            .catch(() => {
              return res
                .status(500)
                .json({ error: "Erro ao salvar uma ou mais imagens" });
            });
        }
      );
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

  // READ ONE
  static async getProjectByIdUser(req, res) {
    const { id_usuario } = req.params;

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
    const { id_projeto} = req.params;
    const { titulo, descricao } = req.body;

    if (!id_projeto || !titulo || !descricao) {
      return res
        .status(400)
        .json({ error: "ID, título e descrição são obrigatórios" });
    }

    try {
      const query = `UPDATE projeto SET titulo = ?, descricao = ? WHERE id_projeto = ?`;
      connect.query(query, [titulo, descricao, id_projeto], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao atualizar projeto" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Projeto não encontrado" });
        }

        return res.status(200).json({ message: "Projeto atualizado com sucesso" });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }

  // DELETE
  static async deleteProject(req, res) {
    const { id_projeto } = req.params;

    if (!id_projeto) return res.status(400).json({ error: "ID é obrigatório" });

    try {
      const query = `DELETE FROM projeto WHERE id_projeto = ?`;
      connect.query(query, [id_projeto], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao deletar projeto" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Projeto não encontrado" });
        }

        return res.status(200).json({ message: "Projeto deletado com sucesso" });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }
};