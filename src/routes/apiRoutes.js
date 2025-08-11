const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT");

const userController = require("../controllers/userController");
const ideiaController = require("../controllers/ideiaController");

// Rotas userController
router.post('/user', userController.createUser);
router.put('/user', verifyJWT, userController.updateUser);
router.delete('/user/:id', verifyJWT, userController.deleteUser);
router.post('/login', userController.loginUser);

// Rotas ideiaController
router.post('/ideia', verifyJWT, ideiaController.createIdeia);
router.get('/ideia', ideiaController.getAllIdeia);
router.get('/ideia', ideiaController.getIdeia);
router.put('/ideia', verifyJWT, ideiaController.updateIdeia);
router.delete('/ideia/:id', verifyJWT, ideiaController.deleteIdeia);


module.exports = router;