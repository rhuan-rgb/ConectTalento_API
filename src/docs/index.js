// docs/index.js
const userPaths = require("./paths/user");
const userSchemas = require("./schemas/user");

const projectPaths = require("./paths/project");
const projectSchemas = require("./schemas/project");

const extrainfoPaths = require("./paths/extrainfo");
const extrainfoSchemas = require("./schemas/extrainfo");

module.exports = {
  openapi: "3.0.0",

  info: {
    title: "ConecTalento API",
    version: "1.0.0",
    description: "Documentação da API ConecTalento",
  },

  servers: [
    {
      url: "http://localhost:5000/api/v1",
      description: "Servidor local",
    },
    {
      url: "https://conectalento-teste.northcentralus.cloudapp.azure.com:5000/api/v1",
      description: "Servidor de Produção",
    },
  ],

  /**
   * ROTAS DOCUMENTADAS
   */
  paths: {
    ...userPaths,
    ...projectPaths,  // Integrando o módulo 
    ...extrainfoPaths
  },

  components: {
    /**
     * SCHEMAS
     */
    schemas: {
      ...userSchemas,
      ...projectSchemas, // Integrando os schemas 
      ...extrainfoSchemas
    },

    /**
     * AUTENTICAÇÃO JWT
     */
    securitySchemes: {
      bearerAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
      },
    },
  },
};
