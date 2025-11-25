module.exports = {
  ExtraInfo: {
    type: "object",
    properties: {
      ID_user: { type: "integer" },
      link_insta: { type: "string", nullable: true },
      link_facebook: { type: "string", nullable: true },
      link_github: { type: "string", nullable: true },
      link_pinterest: { type: "string", nullable: true },
      numero_telefone: { type: "string", nullable: true }
    }
  },

  ExtraInfoUpdate: {
    type: "object",
    required: ["ID_user"],
    properties: {
      ID_user: { type: "integer" },
      link_insta: { type: "string", example: "https://www.instagram.com/seu_user" },
      link_facebook: { type: "string", example: "https://www.facebook.com/seu_user" },
      link_github: { type: "string", example: "https://github.com/seu_user" },
      link_pinterest: { type: "string", example: "https://br.pinterest.com/seu_user" },
      numero_telefone: { type: "string", example: "11987654321" }
    }
  }
};
