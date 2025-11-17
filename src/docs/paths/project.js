const { Project, ProjectInput } = require("../schemas/projects");

module.exports = {
  "/project/{ID_user}": {
    post: {
      tags: ["Project"],
      summary: "Criar um projeto",
      description: "Cria um novo projeto com título, descrição e imagens (upload).",
      parameters: [
        { name: "ID_user", in: "path", required: true, schema: { type: "integer" } }
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                titulo: { type: "string", example: "Meu Projeto" },
                descricao: { type: "string", example: "Descrição detalhada" },
                imagens: {
                  type: "array",
                  items: { type: "string", format: "binary" }
                }
              },
              required: ["titulo", "descricao", "imagens"]
            }
          }
        }
      },
      responses: {
        201: {
          description: "Projeto criado com sucesso",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Projeto criado com sucesso!" },
                  projetoId: { type: "integer", example: 1 }
                }
              }
            }
          }
        },
        400: { description: "Erro de validação" },
        500: { description: "Erro no servidor" }
      }
    }
  },

  "/projects/{user}": {
    get: {
      tags: ["Project"],
      summary: "Listar projetos de um usuário pelo username",
      parameters: [
        { name: "user", in: "path", required: true, schema: { type: "string" } }
      ],
      responses: {
        200: {
          description: "Lista de projetos do usuário",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  profile_projeto: {
                    type: "array",
                    items: Project
                  }
                }
              }
            }
          }
        },
        404: { description: "Usuário ou projetos não encontrados" },
        500: { description: "Erro no servidor" }
      }
    }
  },

  "/project/{ID_projeto}": {
    delete: {
      tags: ["Project"],
      summary: "Deletar um projeto",
      description: "Deleta um projeto do usuário logado",
      parameters: [
        { name: "ID_projeto", in: "path", required: true, schema: { type: "integer" } }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ID_user: { type: "integer", example: 1 }
              },
              required: ["ID_user"]
            }
          }
        }
      },
      responses: {
        200: { description: "Projeto deletado com sucesso" },
        400: { description: "Erro de permissão ou ID inválido" },
        404: { description: "Projeto não encontrado" },
        500: { description: "Erro no servidor" }
      }
    }
  }
};
