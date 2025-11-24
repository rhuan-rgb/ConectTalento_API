# ConectTalento_API
Este repositório contém a api do site conectalento.com, servindo como intermediário entre o front e o banco de dados do sistema.
É aqui onde as rotas http e os processos internos ocorrem e são configurados.
Segue o link do front e do mobile desta aplicação, respectivamente:

- https://github.com/Arthur16800/Front_ConecTalento

- https://github.com/Arthur16800/Mobile_ConecTalento

## dependências utilizadas:
- "axios": "^1.7.7",
- "cors": "^2.8.5",
- "dotenv-safe": "^9.1.0",
- "express": "^4.21.0",
- "jsonwebtoken": "^9.0.2",
- "mysql2": "^3.14.3",
- "nodemailer": "^7.0.5"

## como rodar
para rodar, é necessário possuir instalado no computador:
- git bash
- docker
- editor de código (caso não tenha, recomendo baixar o vscode)

segue o passo a passo:

- clique com o botão direito na área de trabalho e clique em "abrir git bash"
- copie este comando usando shift + insert, ou clique com o botão direito e clique em "paste": git clone https://github.com/rhuan-rgb/ConectTalento_API.git
- abra a pasta gerada na área de trabalho com seu editor de código e abra o terminal
- antes de prosseguir para os comandos certifique-se de ter aberto o docker pelo menos uma vez antes para que assim seus comandos funcionem;
- no terminal, cole este comando: docker compose up --build
- após os processos terminarem, segure a tecla "ctrl" e aperte "c" até que o terminal seja cancelado;
- feito isso, cole novamente este comando: docker compose up --build
- pronto, a api está funcionando.

## 📄 Swagger (Documentação da API)

A documentação da API pode ser acessada em:

**https://api-conectalento.eastus2.cloudapp.azure.com:5000/docs/**


