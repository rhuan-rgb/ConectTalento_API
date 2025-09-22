const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT"); // esperar para implementar

const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");

// Rotas userController
router.post('/user', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/user/:id', verifyJWT, userController.updateUser);
router.put("/user/newpassword/:id", verifyJWT, userController.updatePassword);
router.delete('/user/:id',verifyJWT, userController.deleteUser); 
router.get("/user", userController.getAllUsers);
router.get("/user/likedProjects/:id", userController.getAllLikedProjects);


router.get("/user/:user", userController.getUserByName);



//Rotas projetoController
router.post('/project', projectController.createProject);
router.get("/projects", projectController.getAllProjects);
router.get("/projects/like", projectController.getAllProjectsOrderByTotalLikes);
router.get("/project/:id", projectController.getProjectByIdUser);
router.post("/project/like", projectController.like_or_dislike_projects);
router.put("/project/:id", projectController.updateProject);
router.delete("/project/:id", projectController.deleteProject);


module.exports = router;