# Baixa e executa a imagem do node na versão alpine
FROM node:alpine
# define o local onde o app ira ficar no disco do container
# o caminho o DEV quem escolhe
WORKDIR /usr/app
# Copia tudo com package e termina com .json no usr/app
COPY package*.json ./
RUN npm install
# copia tudo que esta no diretorio onde o arquivo dockerfile esta
COPY . .
EXPOSE 5000
CMD npm start