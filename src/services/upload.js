const multer = require("multer");
const storage = multer.memoryStorage(); // salva na memoria ram
const upload = multer({ storage });

module.exports = upload;