const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT"); // esperar para implementar
const upload = require("../services/upload");

const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");

// Rotas userController
router.post('/user', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/user', userController.updateUser); // refatorar
router.delete('/user/:id', userController.deleteUser); // refatorar
router.get("/user", userController.getAllUsers);
router.get("/user/:user", userController.getUserByName);


//Rotas projetoController
router.post('/project', projectController.createProject);
router.post("/project/:ID_user", upload.array("imagens"), projectController.createProject);
router.get("/projects", projectController.getAllProjects);
router.get("/project/:id", projectController.getProjectByIdUser);
router.put("/project/:id", projectController.updateProject);
router.delete("/project/:id", projectController.deleteProject);


module.exports = router;