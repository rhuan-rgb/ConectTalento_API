const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT"); // esperar para implementar

const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");

// Rotas userController
router.post('/user', userController.createUser);
router.post('/login', userController.loginUser);
router.post("/user/validatecode", userController.validateCode);
router.put('/user', userController.updateUser); // refatorar
router.delete('/user/:id', userController.deleteUser); // refatorar
router.get("/user", userController.getAllUsers);
router.get("/user/:user", userController.getUserByName);


//Rotas projetoController
router.post('/project', projectController.createProject);
router.get("/projects", projectController.getAllProjects);
router.get("/project/:id", projectController.getProjectByIdUser);
router.put("/project/:id", projectController.updateProject);
router.delete("/project/:id", projectController.deleteProject);


module.exports = router;