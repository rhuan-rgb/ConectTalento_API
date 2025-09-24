CREATE DATABASE IF NOT EXISTS conectalento
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE conectalento;

-- ========================================================
-- =============== TABELAS PRINCIPAIS =====================
-- ========================================================

-- Usuários
CREATE TABLE usuario (
  ID_user      INT PRIMARY KEY AUTO_INCREMENT,
  email        VARCHAR(255) NOT NULL UNIQUE,
  autenticado  BOOLEAN NOT NULL,
  imagem       LONGBLOB,
  biografia    TEXT,
  senha        VARCHAR(255) NOT NULL,
  plano        BOOLEAN NOT NULL,
  username     VARCHAR(50) NOT NULL UNIQUE,
  name         VARCHAR(50) NOT NULL,
  criado_em    DATETIME NOT NULL,
  KEY ix_auth_criado (autenticado, criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projeto
CREATE TABLE projeto (
  ID_projeto   INT PRIMARY KEY AUTO_INCREMENT,
  titulo       VARCHAR(150) NOT NULL,
  descricao    VARCHAR(255) NOT NULL,
  total_curtidas INT DEFAULT 0,
  criado_em    DATETIME NOT NULL,
  ID_user      INT NOT NULL,
  CONSTRAINT fk_projeto_user FOREIGN KEY (ID_user) REFERENCES usuario(ID_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Curtidas
CREATE TABLE curtidas (
  ID_curtida INT PRIMARY KEY AUTO_INCREMENT,
  ID_user    INT NOT NULL,
  ID_projeto INT NOT NULL,
  CONSTRAINT fk_curtida_user    FOREIGN KEY (ID_user) REFERENCES usuario(ID_user),
  CONSTRAINT fk_curtida_projeto FOREIGN KEY (ID_projeto) REFERENCES projeto(ID_projeto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Código de validação
CREATE TABLE code_validacao (
  code           CHAR(6) NOT NULL PRIMARY KEY,
  code_expira_em DATETIME NOT NULL,
  ID_user        INT NOT NULL,
  KEY ix_code_expira (code_expira_em),
  CONSTRAINT fk_code_user FOREIGN KEY (ID_user) REFERENCES usuario(ID_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Informações extras do usuário
CREATE TABLE extrainfo (
  ID_extrainfo   INT PRIMARY KEY AUTO_INCREMENT,
  link_insta     VARCHAR(255),
  link_facebook  VARCHAR(255),
  link_github    VARCHAR(255),
  link_pinterest VARCHAR(255),
  numero_telefone CHAR(11),
  ID_user        INT NOT NULL,
  CONSTRAINT fk_extrainfo_user FOREIGN KEY (ID_user) REFERENCES usuario(ID_user) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Imagens de projetos
CREATE TABLE imagens (
  ID_imagem   INT PRIMARY KEY AUTO_INCREMENT,
  imagem      LONGBLOB NOT NULL,
  tipo_imagem VARCHAR(100) NOT NULL,
  ordem       INT NOT NULL,
  ID_projeto  INT NOT NULL,
  CONSTRAINT fk_imagens_projeto FOREIGN KEY (ID_projeto) REFERENCES projeto(ID_projeto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- =============== TABELAS DE LOG =========================
-- ========================================================

-- Log de códigos de validação
CREATE TABLE code_validacao_log (
  code           CHAR(6) NOT NULL PRIMARY KEY,
  code_expira_em DATETIME NOT NULL,
  data_deletado  DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log de informações extras
CREATE TABLE extrainfo_log (
  ID_extrainfo   INT PRIMARY KEY AUTO_INCREMENT,
  link_insta     VARCHAR(255),
  link_facebook  VARCHAR(255),
  link_github    VARCHAR(255),
  link_pinterest VARCHAR(255),
  numero_telefone CHAR(11),
  ID_user        INT NOT NULL,
  data_deletado  DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log de imagens
CREATE TABLE imagens_log (
  ID_imagem   INT PRIMARY KEY AUTO_INCREMENT,
  imagem      LONGBLOB NOT NULL,
  data_deletado DATETIME NOT NULL,
  ID_projeto  INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log de projetos
CREATE TABLE projeto_log (
  ID_projeto  INT PRIMARY KEY AUTO_INCREMENT,
  titulo      VARCHAR(150) NOT NULL,
  descricao   VARCHAR(255) NOT NULL,
  data_deletado DATETIME NOT NULL,
  ID_user     INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log de usuários
CREATE TABLE usuario_log (
  ID_user      INT PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  autenticado  BOOLEAN NOT NULL,
  imagem       LONGBLOB,
  biografia    TEXT,
  senha        VARCHAR(50) NOT NULL,
  plano        BOOLEAN NOT NULL,
  username     VARCHAR(50) NOT NULL,
  criado_em    DATETIME NOT NULL,
  name         VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- =============== TRIGGERS ===============================
-- ========================================================

-- Curtidas
CREATE TRIGGER adicionar_curtida
AFTER INSERT ON curtidas
FOR EACH ROW
BEGIN
  UPDATE projeto
  SET total_curtidas = total_curtidas + 1
  WHERE ID_projeto = NEW.ID_projeto;
END;

CREATE TRIGGER remover_curtida
AFTER DELETE ON curtidas
FOR EACH ROW
BEGIN
  UPDATE projeto
  SET total_curtidas = total_curtidas - 1
  WHERE ID_projeto = OLD.ID_projeto;
END;

-- Extrainfo → Log
CREATE TRIGGER trg_extrainfo_to_extrainfo_log
AFTER DELETE ON extrainfo
FOR EACH ROW
BEGIN
  INSERT INTO extrainfo_log (
    ID_extrainfo, link_insta, link_facebook, link_github,
    link_pinterest, numero_telefone, data_deletado
  ) VALUES (
    OLD.ID_extrainfo, OLD.link_insta, OLD.link_facebook, OLD.link_github,
    OLD.link_pinterest, OLD.numero_telefone, NOW()
  );
END;

-- Imagens → Log
CREATE TRIGGER trg_imagens_to_imagens_log
AFTER DELETE ON imagens
FOR EACH ROW
BEGIN
  INSERT INTO imagens_log (ID_imagem, imagem, data_deletado)
  VALUES (OLD.ID_imagem, OLD.imagem, NOW());
END;

-- Projeto → Log
CREATE TRIGGER trg_projeto_to_projeto_log
AFTER DELETE ON projeto
FOR EACH ROW
BEGIN
  INSERT INTO projeto_log (ID_projeto, titulo, descricao, data_deletado)
  VALUES (OLD.ID_projeto, OLD.titulo, OLD.descricao, NOW());
END;

-- Usuário → Logs
CREATE TRIGGER trg_usuario_to_user_log
AFTER DELETE ON usuario
FOR EACH ROW
BEGIN
  INSERT INTO usuario_log (
    ID_user, email, autenticado, biografia, senha, plano, username, criado_em, data_deletado
  ) VALUES (
    OLD.ID_user, OLD.email, OLD.autenticado, OLD.biografia, OLD.senha, OLD.plano, OLD.username, OLD.criado_em, NOW()
  );
END;

-- ========================================================
-- =============== EVENTOS ================================
-- ========================================================

-- Expirar códigos de validação
CREATE EVENT ev_purge_code_validacao
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
  INSERT INTO code_validacao_log (code, code_expira_em, data_deletado)
  SELECT code, code_expira_em, NOW()
  FROM code_validacao
  WHERE code_expira_em <= NOW();

  DELETE FROM code_validacao
  WHERE code_expira_em <= NOW();
END;

-- Remover usuários não verificados
CREATE EVENT ev_purge_unverified_users
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
  DELETE FROM usuario
  WHERE autenticado = FALSE
    AND criado_em <= NOW() - INTERVAL 1 HOUR;
END;
