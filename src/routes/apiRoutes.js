const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT"); // esperar para implementar
const upload = require("../services/upload");

const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");

// Rotas userController
router.post('/user', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/user/:id', verifyJWT, userController.updateUser);
router.put("/user/newpassword/:id", verifyJWT, userController.updatePassword);
router.delete('/user/:id',verifyJWT, userController.deleteUser); 
router.get("/user", userController.getAllUsers);

router.get("/user/:user", userController.getUserByName);



//Rotas projetoController
router.post('/project', projectController.createProject);
router.post("/project", upload.array("imagens"), projectController.createProject);
router.get("/projects", projectController.getAllProjects);
router.get("/project/:id", projectController.getProjectByIdUser);
router.put("/project/:id", projectController.updateProject);
router.delete("/project/:id", projectController.deleteProject);



module.exports = router;