module.exports = {
    CreateUser: {
      type: "object",
      required: ["email", "password", "confirmPassword", "username", "name"],
      properties: {
        email: {
          type: "string",
          example: "exemplo@email.com",
        },
        password: {
          type: "string",
          example: "123456",
        },
        confirmPassword: {
          type: "string",
          example: "123456",
        },
        username: {
          type: "string",
          example: "meuusername",
        },
        name: {
          type: "string",
          example: "Meu Nome",
        },
        code: {
          type: "string",
          nullable: true,
          description: "Código enviado ao e-mail para autenticação",
          example: "",
        },
      },
    },
  
    LoginUser: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", example: "email@teste.com" },
        password: { type: "string", example: "123456" },
      },
    },
  
    UpdatePassword: {
      type: "object",
      required: ["senha_atual", "nova_senha"],
      properties: {
        senha_atual: { type: "string", example: "123456" },
        nova_senha: { type: "string", example: "654321" },
      },
    },
  
    UserList: {
      type: "object",
      properties: {
        users: {
          type: "array",
          items: { $ref: "#/components/schemas/UserProfile" },
        },
      },
    },
  
    UserProfile: {
      type: "object",
      properties: {
        id: { type: "string", example: "1" },
        name: { type: "string", example: "Arthur" },
        username: { type: "string", example: "arthurzin" },
        email: { type: "string", example: "email@teste.com" },
  
        biografia: {
          type: "string",
          nullable: true,
          example: "Dev apaixonado por código",
        },
  
        imagem: {
          type: "string",
          nullable: true,
          example: "data:image/png;base64,iVBORw0KGgoAAA...",
        },
  
        tipo_imagem: { type: "string", nullable: true, example: "image/png" },
  
        plano: { type: "boolean", example: false },
  
        extrainfo: {
          type: "object",
          nullable: true,
          properties: {
            link_insta: {
              type: "string",
              nullable: true,
              example: "https://instagram.com/user",
            },
            link_facebook: { type: "string", nullable: true, example: null },
            link_github: {
              type: "string",
              nullable: true,
              example: "https://github.com/user",
            },
            link_pinterest: { type: "string", nullable: true, example: null },
            numero_telefone: {
              type: "string",
              nullable: true,
              example: "+55 11 99999-0000",
            },
          },
        },
      },
    },
  };
  