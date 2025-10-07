const connect = require("../db/connect");

const validateProject = {

    validateProjectUserLength: async function (ID_user) {
        return new Promise((resolve, reject) => {
            const query = "SELECT COUNT(*) AS total_projetos FROM projeto WHERE ID_user = ?;";
            connect.query(query, [ID_user], (err, results) => {
                if (err) {
                    return reject(err);
                }
                const totalProjetos = results[0].total_projetos;
                resolve(totalProjetos.length >= 5); // true se já excedeu o limite, false se não excedeu o limite
            });
        });
    }
}

module.exports = validateProject;