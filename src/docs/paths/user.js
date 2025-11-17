module.exports = {
    "/user": {
      post: {
        tags: ["User"],
        summary: "Criar usuario validando o email",
        description:
          "Preencha os campos, deixe 'code' vazio, envie os dados, copie o codigo que chegará ao email e preencha o campo 'code' com o codigo, assim envie novamente os dados e o usuario será criado",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUser" },
            },
          },
        },
  
        responses: {
          201: {
            description: "Pré-cadastro criado e código enviado ao e-mail.",
            content: {
              "application/json": {
                example: {
                  message: "Código enviado ao e-mail.",
                },
              },
            },
          },
  
          202: {
            description: "Código reenviado para e-mail já pré-cadastrado.",
            content: {
              "application/json": {
                example: {
                  message: "Código reenviado ao e-mail.",
                },
              },
            },
          },
  
          200: {
            description: "Código validado e usuário autenticado.",
            content: {
              "application/json": {
                example: {
                  message: "Código válido. Usuário autenticado.",
                  user: {
                    ID_user: 1,
                    email: "teste@email.com",
                    username: "teste123",
                    name: "Fulano",
                    plano: false,
                    criado_em: "2024-10-26",
                    autenticado: true,
                  },
                  token: "jwt_token_exemplo",
                },
              },
            },
          },
  
          400: {
            description: "Erro de validação (e-mail, senha, code incorreto, etc.)",
            content: {
              "application/json": {
                example: { error: "Código inválido." },
              },
            },
          },
  
          500: {
            description: "Erro interno",
          },
        },
      },
  
      get: {
        tags: ["User"],
        summary: "Listar todos os usuários",
        security: [],
        responses: {
          200: {
            description: "Lista de usuários",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserList" },
              },
            },
          },
        },
      },
    },
  
    "/login": {
      post: {
        tags: ["User"],
        summary: "Login de usuário",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginUser" },
            },
          },
        },
        responses: {
          200: { description: "Login bem sucedido" },
          404: { description: "Usuário não encontrado" },
          403: { description: "Senha incorreta" },
        },
      },
    },
  
    "/user/newpassword/{id}": {
      put: {
        tags: ["User"],
        summary: "Atualizar senha do usuário",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePassword" },
            },
          },
        },
        responses: {
          200: { description: "Senha atualizada com sucesso" },
          400: { description: "Erro de validação" },
          401: { description: "Senha atual incorreta" },
          404: { description: "Usuário não encontrado" },
        },
      },
    },
  
    "/user/{username}": {
      get: {
        tags: ["User"],
        summary: "Buscar usuário pelo username",
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Perfil encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfile" },
              },
            },
          },
          404: { description: "Perfil não encontrado" },
        },
      },
    },
  
    "/user/{id}": {
      delete: {
        tags: ["User"],
        summary: "Deletar usuário por ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Usuário deletado com sucesso" },
          404: { description: "Usuário não encontrado" },
        },
      },
    },
  };
  