module.exports = {
  Project: {
    type: "object",
    properties: {
      ID_projeto: { type: "integer", example: 1 },
      titulo: { type: "string", example: "Meu Projeto" },
      descricao: { type: "string", example: "Descrição detalhada do projeto" },
      total_curtidas: { type: "integer", example: 10 },

      autor: {
        type: "object",
        properties: {
          nome: { type: "string", example: "Arthur Silva" },
          username: { type: "string", example: "arthur123" },
          imagem: { type: "string", format: "byte", example: "Base64 da imagem" },
          tipo_imagem: { type: "string", example: "image/png" }
        }
      },

      imagens: {
        type: "array",
        items: {
          type: "object",
          properties: {
            ID_imagem: { type: "integer", example: 1 },
            imagem: { type: "string", format: "byte", example: "Base64 da imagem" },
            tipo_imagem: { type: "string", example: "image/png" },
            ordem: { type: "integer", example: 1 }
          }
        }
      }
    }
  },

  ProjectInput: {
    type: "object",
    properties: {
      titulo: { type: "string", example: "Novo Projeto" },
      descricao: { type: "string", example: "Descrição do projeto" },
      ID_user: { type: "integer", example: 1 }
    },
    required: ["titulo", "descricao"]
  }
};
