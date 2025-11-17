// docs/index.js
const userPaths = require("./paths/user");
const userSchemas = require("./schemas/user");

const projectPaths = require("./paths/project");
const projectSchemas = require("./schemas/projects");

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
      url: "https://api-conectalento.eastus2.cloudapp.azure.com:5000/api/v1",
      description: "Servidor de Produção",
    },
  ],

  /**
   * ROTAS DOCUMENTADAS
   */
  paths: {
    ...userPaths,
    ...projectPaths,  // Integrando o módulo de projetos
    // ...postPaths,
    // ...outros módulos
  },

  components: {
    /**
     * SCHEMAS
     */
    schemas: {
      ...userSchemas,
      ...projectSchemas, // Integrando os schemas de projetos
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

  /**
   * Se quiser exigir JWT em TODAS as rotas,
   * descomente abaixo.
   */
  // security: [{ bearerAuth: [] }],
};
