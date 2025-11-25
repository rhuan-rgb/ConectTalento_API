const { Project, ProjectInput } = require("../schemas/project");

module.exports = {
  // -----------------------------
  // CREATE PROJECT
  // -----------------------------
  "/project/{ID_user}": {
    post: {
      tags: ["Project"],
      summary: "Criar um projeto",
      security: [{ bearerAuth: [] }],
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
              required: ["titulo", "descricao"]
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

  // -----------------------------
  // LISTA TODOS OS PROJETOS DO SISTEMA
  // -----------------------------
  "/projects": {
    get: {
      tags: ["Project"],
      summary: "Listar todos os projetos",
      description: "Retorna lista de todos os projetos com imagem principal.",
      responses: {
        200: {
          description: "Lista de projetos",
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
        500: { description: "Erro no servidor" }
      }
    }
  },

  // -----------------------------
  // LISTAR PROJETOS PELO USERNAME
  // -----------------------------
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

  // -----------------------------
  // BUSCAR PROJETOS (SEARCH)
  // -----------------------------
  "/project/search": {
    get: {
      tags: ["Project"],
      summary: "Buscar projetos por nome",
      parameters: [
        {
          name: "q",
          in: "query",
          required: false,
          schema: { type: "string" },
          description: "Texto da busca"
        }
      ],
      responses: {
        200: {
          description: "Resultados da busca",
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
        500: { description: "Erro no servidor" }
      }
    }
  },

  // -----------------------------
  // DETALHE DO PROJETO
  // -----------------------------
  "/projectdetail/{ID_projeto}": {
    get: {
      tags: ["Project"],
      summary: "Buscar detalhes de um projeto",
      parameters: [
        { name: "ID_projeto", in: "path", required: true, schema: { type: "integer" } }
      ],
      responses: {
        200: {
          description: "Detalhes do projeto",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  projeto: Project
                }
              }
            }
          }
        },
        404: { description: "Projeto não encontrado" },
        500: { description: "Erro no servidor" }
      }
    }
  },

  // -----------------------------
  // LIKE / DISLIKE
  // -----------------------------
  "/like_dislike_projects": {
    post: {
      tags: ["Project"],
      summary: "Curtir ou descurtir um projeto",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                ID_projeto: { type: "integer", example: 10 },
                ID_user: { type: "integer", example: 1 }
              },
              required: ["ID_projeto", "ID_user"]
            }
          }
        }
      },
      responses: {
        200: { description: "Like/unlike realizado" },
        400: { description: "Erro ao curtir/descurtir" },
        500: { description: "Erro no servidor" }
      }
    }
  },

  // -----------------------------
  // DELETE PROJECT
  // -----------------------------
  "/project/{ID_projeto}": {
    delete: {
      tags: ["Project"],
      summary: "Deletar um projeto",
      security: [{ bearerAuth: [] }],
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
        200: { description: "Projeto deletado" },
        400: { description: "Erro de permissão" },
        404: { description: "Não encontrado" },
        500: { description: "Erro no servidor" }
      }
    }
  }
};
