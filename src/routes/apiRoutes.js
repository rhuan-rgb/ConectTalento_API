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
router.put("/user/imagem/:id", upload.array("imagens"), verifyJWT, userController.updateImagemUser)
router.delete('/user/:id',verifyJWT, userController.deleteUser); 
router.get("/user", userController.getAllUsers);
router.get("/user/:user", userController.getUserByName);

//Rotas projetoController
router.post("/project/:ID_user", upload.array("imagens"), projectController.createProject);
router.post("/like_dislike_projects", projectController.like_or_dislike_projects)
router.get("/projects", projectController.getAllProjects);
router.get("/projects/:user", projectController.getProjectsByUserName);
router.get("/projectsliked/:ID_user", projectController.getProjectsLikedUser);
router.get("/projectdetail/:ID_projeto", projectController.getProject);
router.delete("/project/:ID_projeto", projectController.deleteProject);
router.put("/project/:id",  upload.array("imagens"), verifyJWT, projectController.updateProject);



module.exports = router;