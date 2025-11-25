const router = require('express').Router();
const verifyJWT = require("../services/verifyJWT"); 
const upload = require("../services/upload");

const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");
const extraInfoController = require("../controllers/extraInfoController")

// Rotas userController
router.post('/user', userController.createUser);
router.post('/login', userController.loginUser);
router.post("/pagamento-pix/:id", verifyJWT, userController.paymentUserPix)
router.put("/user/forgotpassword/", userController.forgotPassword);
router.put("/user/newpassword/:id", verifyJWT, userController.updatePassword);
router.put('/user/:id', upload.array("imagens"), verifyJWT, userController.updateUser);
router.delete('/user/:id',verifyJWT, userController.deleteUser); 
router.get("/pagamento/pix/status/:id/:paymentId", verifyJWT, userController.getPaymentPixStatus);
router.get("/user", userController.getAllUsers);
router.get("/user/:user", userController.getUserByName);
router.get("/userId/:id", userController.getUserById);

//Rotas projetoController
router.post("/project/:ID_user", verifyJWT, upload.array("imagens"), projectController.createProject); 
router.post("/like_dislike_projects", verifyJWT, projectController.like_or_dislike_projects)
router.get("/projects", projectController.getAllProjects);
router.get("/projects/:user", projectController.getProjectsByUserName);
router.get("/projectsliked/:ID_user", projectController.getProjectsLikedUser);
router.get("/projectdetail/:ID_projeto", projectController.getProject);
router.get("/project/search", projectController.searchProjects);
router.delete("/project/:ID_projeto", verifyJWT, projectController.deleteProject);
router.put("/project/:id", verifyJWT, upload.array("imagens"),projectController.updateProject);

//Rotas extraInfoController
router.get("/extrainfo/:id", extraInfoController.getExtraInfo);
router.put("/extrainfo", verifyJWT, extraInfoController.updateExtraInfo);



module.exports = router;