const userPaths = require("./paths/user");
const userSchemas = require("./schemas/user");

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
    // {
    //   url: "http://IP-DA-SUA-VM/api/v1",
    //   description: "Servidor de Produção",
    // }
  ],

  /**
   * ROTAS DOCUMENTADAS
   */
  paths: {
    ...userPaths,
    // ...projectPaths,
    // ...postPaths,
    // ...outros módulos
  },

  components: {
    /**
     * SCHEMAS
     */
    schemas: {
      ...userSchemas,
      // ...projectSchemas,
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
