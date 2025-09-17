CREATE DATABASE IF NOT EXISTS conectalento
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE conectalento;

-- ========= TABELAS =========
CREATE TABLE `usuario` (
  `ID_user`     INT PRIMARY KEY AUTO_INCREMENT,
  `email`       VARCHAR(255) UNIQUE NOT NULL,
  `autenticado` BOOLEAN      NOT NULL,
  `imagem_user` LONGBLOB NULL,
  `tipo_imagem` VARCHAR(100) NULL,
  `biografia`   TEXT         NULL,
  `senha`       VARCHAR(255) NOT NULL,
  `plano`       BOOLEAN      NOT NULL,
  `username`    VARCHAR(50)  UNIQUE NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `criado_em`   DATETIME     NOT NULL,
  INDEX `ix_auth_criado` (`autenticado`,`criado_em`)
) ENGINE=InnoDB;

CREATE TABLE `projeto` (
  `ID_projeto`  INT PRIMARY KEY AUTO_INCREMENT,
  `titulo`      VARCHAR(150) NOT NULL,
  `descricao`   VARCHAR(255) NOT NULL,
  `ID_user`     INT NOT NULL,
  `ID_imagem`   INT NULL,
  CONSTRAINT `fk_projeto_user`
    FOREIGN KEY (`ID_user`) REFERENCES `usuario`(`ID_user`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `imagens` (
  `ID_imagem`  INT PRIMARY KEY AUTO_INCREMENT,
  `imagem`     LONGBLOB NOT NULL,
  `ID_projeto` INT      NOT NULL,
  CONSTRAINT `fk_imagens_projeto`
    FOREIGN KEY (`ID_projeto`) REFERENCES `projeto`(`ID_projeto`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- FK de capa do projeto (após existir imagens)
ALTER TABLE `projeto`
  ADD CONSTRAINT `fk_projeto_capa_imagem`
    FOREIGN KEY (`ID_imagem`) REFERENCES `imagens`(`ID_imagem`)
    ON DELETE SET NULL;

CREATE TABLE `extrainfo` (
  `ID_extrainfo`    INT PRIMARY KEY AUTO_INCREMENT,
  `link_insta`      VARCHAR(255),
  `link_facebook`   VARCHAR(255),
  `link_github`     VARCHAR(255),
  `link_pinterest`  VARCHAR(255),
  `numero_telefone` CHAR(11),
  `ID_user`         INT NOT NULL,
  CONSTRAINT `fk_extrainfo_user`
    FOREIGN KEY (`ID_user`) REFERENCES `usuario`(`ID_user`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `code_validacao` (
  `code`           CHAR(6)     PRIMARY KEY,
  `code_expira_em` DATETIME    NOT NULL,
  `ID_user`        INT NOT NULL,
  CONSTRAINT `fk_code_user`
    FOREIGN KEY (`ID_user`) REFERENCES `usuario`(`ID_user`)
    ON DELETE CASCADE,
  INDEX `ix_code_expira` (`code_expira_em`)
) ENGINE=InnoDB;

-- ========= LOGS =========
CREATE TABLE `user_log` (
  `ID_user`       INT PRIMARY KEY,
  `email`         VARCHAR(255) NOT NULL,
  `autenticado`   BOOLEAN      NOT NULL,
  `imagem_user`   LONGBLOB NULL,
  `tipo_imagem`   VARCHAR(100) NULL,
  `biografia`     TEXT         NULL,
  `senha`         VARCHAR(255) NOT NULL,
  `plano`         BOOLEAN      NOT NULL,
  `username`      VARCHAR(50)  NOT NULL,
  `name`          VARCHAR(255) NOT NULL,
  `criado_em`     DATETIME     NOT NULL,
  `data_deletado` DATETIME     NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `projeto_log` (
  `ID_projeto`    INT PRIMARY KEY,
  `titulo`        VARCHAR(150) NOT NULL,
  `descricao`     VARCHAR(255) NOT NULL,
  `data_deletado` DATETIME     NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `imagens_log` (
  `ID_imagem`     INT PRIMARY KEY,
  `imagem`        LONGBLOB NOT NULL,
  `data_deletado` DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `extrainfo_log` (
  `ID_extrainfo`    INT PRIMARY KEY,
  `link_insta`      VARCHAR(255),
  `link_facebook`   VARCHAR(255),
  `link_github`     VARCHAR(255),
  `link_pinterest`  VARCHAR(255),
  `numero_telefone` CHAR(11),
  `data_deletado`   DATETIME NOT NULL
) ENGINE=InnoDB;

CREATE TABLE `code_validacao_log` (
  `code`           CHAR(6) PRIMARY KEY,
  `code_expira_em` DATETIME NOT NULL,
  `data_deletado`  DATETIME NOT NULL
) ENGINE=InnoDB;

-- ========= TRIGGERS =========
DELIMITER //

-- Log do usuário após deletar
DROP TRIGGER IF EXISTS trg_usuario_to_user_log//
CREATE TRIGGER trg_usuario_to_user_log
AFTER DELETE ON `usuario`
FOR EACH ROW
BEGIN
  INSERT INTO `user_log` (
    `ID_user`, `email`, `autenticado`, `imagem_user`, `tipo_imagem`, `biografia`, `senha`, `plano`, `username`, `name`, `criado_em`, `data_deletado`
  ) VALUES (
    OLD.`ID_user`, OLD.`email`, OLD.`autenticado`, OLD.`imagem_user`, OLD.`tipo_imagem`, OLD.`biografia`, OLD.`senha`, OLD.`plano`, OLD.`username`, OLD.`name`, OLD.`criado_em`,
    NOW()
  );
END//
  
-- Antes de deletar um PROJETO, registra suas imagens (quando o delete é direto no projeto)
DROP TRIGGER IF EXISTS trg_projeto_log_imagens_cascade//
CREATE TRIGGER trg_projeto_log_imagens_cascade
BEFORE DELETE ON `projeto`
FOR EACH ROW
BEGIN
  INSERT INTO `imagens_log` (`ID_imagem`, `imagem`, `data_deletado`)
  SELECT i.`ID_imagem`, i.`imagem`, NOW()
  FROM `imagens` AS i
  WHERE i.`ID_projeto` = OLD.`ID_projeto`;
END//

-- Após deletar PROJETO, registra o próprio projeto_log (quando o delete é direto no projeto)
DROP TRIGGER IF EXISTS trg_projeto_to_projeto_log//
CREATE TRIGGER trg_projeto_to_projeto_log
AFTER DELETE ON `projeto`
FOR EACH ROW
BEGIN
  INSERT INTO `projeto_log` (`ID_projeto`, `titulo`, `descricao`, `data_deletado`)
  VALUES (OLD.`ID_projeto`, OLD.`titulo`, OLD.`descricao`, NOW());
END//

-- Após deletar IMAGEM diretamente, registra no log
DROP TRIGGER IF EXISTS trg_imagens_to_imagens_log//
CREATE TRIGGER trg_imagens_to_imagens_log
AFTER DELETE ON `imagens`
FOR EACH ROW
BEGIN
  INSERT INTO `imagens_log` (`ID_imagem`, `imagem`, `data_deletado`)
  VALUES (OLD.`ID_imagem`, OLD.`imagem`, NOW());
END//

-- Após deletar EXTRAINFO diretamente, registra no log
DROP TRIGGER IF EXISTS trg_extrainfo_to_extrainfo_log//
CREATE TRIGGER trg_extrainfo_to_extrainfo_log
AFTER DELETE ON `extrainfo`
FOR EACH ROW
BEGIN
  INSERT INTO `extrainfo_log` (
    `ID_extrainfo`, `link_insta`, `link_facebook`, `link_github`,
    `link_pinterest`, `numero_telefone`, `data_deletado`
  ) VALUES (
    OLD.`ID_extrainfo`, OLD.`link_insta`, OLD.`link_facebook`, OLD.`link_github`,
    OLD.`link_pinterest`, OLD.`numero_telefone`, NOW()
  );
END//

-- ===== Log de CASCADE quando deletar USUÁRIO =====
-- (FK cascade não dispara triggers nas tabelas filhas, então registramos aqui)

-- Loga EXTRAINFOS que serão apagados em cascata
DROP TRIGGER IF EXISTS trg_usuario_log_extrainfo_cascade//
CREATE TRIGGER trg_usuario_log_extrainfo_cascade
BEFORE DELETE ON `usuario`
FOR EACH ROW
BEGIN
  INSERT INTO `extrainfo_log` (
    `ID_extrainfo`, `link_insta`, `link_facebook`, `link_github`,
    `link_pinterest`, `numero_telefone`, `data_deletado`
  )
  SELECT e.`ID_extrainfo`, e.`link_insta`, e.`link_facebook`, e.`link_github`,
         e.`link_pinterest`, e.`numero_telefone`, NOW()
  FROM `extrainfo` AS e
  WHERE e.`ID_user` = OLD.`ID_user`;
END//

-- Loga PROJETOS que serão apagados em cascata
DROP TRIGGER IF EXISTS trg_usuario_log_projetos_cascade//
CREATE TRIGGER trg_usuario_log_projetos_cascade
BEFORE DELETE ON `usuario`
FOR EACH ROW
BEGIN
  INSERT INTO `projeto_log` (`ID_projeto`, `titulo`, `descricao`, `data_deletado`)
  SELECT p.`ID_projeto`, p.`titulo`, p.`descricao`, NOW()
  FROM `projeto` AS p
  WHERE p.`ID_user` = OLD.`ID_user`;
END//

-- Loga IMAGENS dos projetos do usuário que serão apagadas em cascata
DROP TRIGGER IF EXISTS trg_usuario_log_imagens_cascade//
CREATE TRIGGER trg_usuario_log_imagens_cascade
BEFORE DELETE ON `usuario`
FOR EACH ROW
BEGIN
  INSERT INTO `imagens_log` (`ID_imagem`, `imagem`, `data_deletado`)
  SELECT i.`ID_imagem`, i.`imagem`, NOW()
  FROM `imagens` AS i
  INNER JOIN `projeto` AS p ON p.`ID_projeto` = i.`ID_projeto`
  WHERE p.`ID_user` = OLD.`ID_user`;
END//

DELIMITER ;

-- ======= EVENTS ======
SET GLOBAL event_scheduler = ON;

DELIMITER //

-- Remove códigos vencidos e registra no log
CREATE EVENT IF NOT EXISTS ev_purge_code_validacao
ON SCHEDULE EVERY 1 MINUTE
STARTS CURRENT_TIMESTAMP + INTERVAL 1 MINUTE
ON COMPLETION PRESERVE
DO
BEGIN
  INSERT INTO `code_validacao_log` (`code`, `code_expira_em`, `data_deletado`)
  SELECT `code`, `code_expira_em`, NOW()
  FROM `code_validacao`
  WHERE `code_expira_em` <= NOW();

  DELETE FROM `code_validacao`
  WHERE `code_expira_em` <= NOW();
END//

-- Remove usuários não verificados após 1 hora (triggers acima garantem os logs)
DROP EVENT IF EXISTS ev_purge_unverified_users//
CREATE EVENT ev_purge_unverified_users
ON SCHEDULE EVERY 1 MINUTE
ON COMPLETION PRESERVE
DO
BEGIN
  DELETE FROM `usuario`
  WHERE `autenticado` = FALSE
    AND `criado_em` <= NOW() - INTERVAL 1 HOUR;
END//

DELIMITER ;