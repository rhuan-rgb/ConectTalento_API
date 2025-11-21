module.exports = {
  "/extrainfo/{id}": {
    get: {
      tags: ["ExtraInfo"],
      summary: "Buscar extra info do usuário",
      description: "Retorna as informações extras vinculadas a um usuário específico.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          description: "ID do usuário",
          schema: { type: "integer" }
        }
      ],
      responses: {
        200: {
          description: "Extra info encontrada",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExtraInfo" }
            }
          }
        },
        404: { description: "Extra info não encontrada" },
        500: { description: "Erro no servidor" }
      }
    }
  },

  "/extrainfo": {
    put: {
      tags: ["ExtraInfo"],
      summary: "Atualizar extra info",
      description: "Atualiza as informações extras do usuário. Requer autenticação JWT.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ExtraInfoUpdate" }
          }
        }
      },
      responses: {
        201: { description: "Extra info atualizada com sucesso" },
        400: { description: "Erro de validação" },
        404: { description: "Extra info não encontrada" },
        500: { description: "Erro no servidor" }
      }
    }
  }
};
