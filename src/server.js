const fs = require('fs');
const https = require('https');
const http = require('http');
const app = require("./index");
const cors = require('cors');
const { swaggerUi, swaggerDocument } = require("./swagger/swagger");

// CORS
const corsOpitions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATH.POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOpitions));

// SWAGGER
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/api-conectalento.eastus2.cloudapp.azure.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/api-conectalento.eastus2.cloudapp.azure.com:5000/fullchain.pem')
};

https.createServer(options, app).listen(5000, () => {
  console.log("Servidor HTTPS rodando na porta 5000");
});

http.createServer((req, res) => {
  res.writeHead(301, {
    "Location": `https://${req.headers.host}${req.url}`
  });
  res.end();
}).listen(80, () => {
  console.log("Redirecionamento HTTP para HTTPS habilitado na porta 80");
});


// http.createServer(app).listen(5000, () => {
//   console.log("Servidor HTTP rodando na porta 5000 (LOCAL APENAS)");
// });

