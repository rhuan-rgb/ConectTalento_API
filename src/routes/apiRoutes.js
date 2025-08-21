const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT");

const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");

// Rotas userController
router.post('/user', userController.createUser);
router.put('/user', verifyJWT, userController.updateUser);
router.delete('/user/:id', verifyJWT, userController.deleteUser);
router.post('/login', userController.loginUser);
router.get("/user", userController.getAllUsers);

//Rotas projetoController
router.post('/project', verifyJWT, projectController.createProject);
router.get("/projects", projectController.getAllProjects);
router.get("/project/:id", projectController.getProjectByIdUser);
router.put("/project/:id", projectController.updateProject);
router.delete("/project/:id", projectController.deleteProject);


module.exports = router;