const connect = require("../db/connect");

const validateProject = {

    validateProjectUserLength: async function (ID_user) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    u.plano AS plano,
                    COUNT(p.ID_projeto) AS total_projetos
                FROM usuario u
                LEFT JOIN projeto p ON p.ID_user = u.ID_user
                WHERE u.ID_user = ?
                GROUP BY u.plano
                LIMIT 1
                `;

            connect.query(query, [ID_user], (err, results) => {
                if (err) return reject(err);

                // Pega a primeira linha (ou um default) já desestruturando
                const [{ plano = 0, total_projetos = 0 } = {}] = results ?? [];

                const limite = (Boolean(plano) ? 20 : 5);
                const total = Number(total_projetos) || 0;

                // true => já atingiu/excedeu o limite (bloqueia criar mais)
                resolve(total >= limite);
            });
        });
    },

}

module.exports = validateProject;