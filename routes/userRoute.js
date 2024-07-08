const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const multer = require('multer');
//const upload =require("./upload")
const path = require("path");





router.post("/register", userController.register);
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.delete("/:id", userController.deleteUser);
router.put("/:id", userController.updateUser);
router.patch("/changeactivity/:id", userController.changeUserActivity);
router.post("/login", userController.login);
router.post("/requestotp", userController.RequestOTP);
router.post("/verifyotp", userController.verifyOTP);
router.post("/resetpassword", userController.resetPassword);
router.post('/change-password',  userController.changePassword);
router.post("/register/google", userController.registerWithGoogle);
router.post("/login/google", userController.loginWithGoogle);

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, "../images"));
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });
  
  
  
  
  router.post("/", upload.single("image"), (req, res) => {
    const userData = {
        ...req.body,
        profilePhoto: req.file ? req.file.filename : null
    };
  
    usersModel.create(userData)
        .then(result => res.json(result))
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: "An error occurred while creating the user" });
        });
  });
  
module.exports = router;
