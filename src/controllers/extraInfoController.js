const connect = require("../db/connect");

module.exports = class extraInfoController {
  static async updateExtraInfo(req,res){
    const {
      link_insta,
      link_facebook,
      link_github,
      link_pinterest,
      numero_telefone,
      ID_user,
    } = req.body; 
     const query =
      "UPDATE extrainfo SET link_insta = ?, link_facebook = ?,link_github = ?, link_pinterest = ?, numero_telefone = ? WHERE ID_user = ?;";

      if(numero_telefone.length !== 11 && numero_telefone.length > 0){
        return res.status(400).json({error: "número de telefone inválido. Deve conter 11 dígitos"});
      }

      if(!link_insta.startsWith("https://") ||
        !link_facebook.startsWith("https://") ||
        !link_github.startsWith("https://") ||
        !link_pinterest.startsWith("https://") ||
        !numero_telefone.startsWith("https://")
        ){
          return res.status(400).json({error: "links inválidos. Devem ser https"});
        }

    try {
      connect.query(
        query,
        [
          link_insta,
          link_facebook,
          link_github,
          link_pinterest,
          numero_telefone,
          ID_user,
        ],
        (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro ao atualizar extrainfo" });
          }
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: "extrainfo não encontrada" });
          }
          return res.status(201).json({
          message: "extrainfo atualizado com sucesso",
        }); 
        }
      );
    } catch (error) {
        console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }
  static async getExtraInfo(req,res){
    const  id_usuario  = req.params.id;

    if (!id_usuario) return res.status(400).json({ error: "ID é obrigatório" });

    try {
      const query = `SELECT * FROM extrainfo WHERE ID_user = ?`;
      connect.query(query, [id_usuario], (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro ao buscar extra info" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "extra info não encontrada" });
        }

        return res.status(200).json(results[0]);
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro no servidor" });
    }
  }
};
