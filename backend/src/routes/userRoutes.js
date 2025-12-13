const router = require("express").Router();
const { getUsers,register,login,logout } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleWare");


router.get("/", getUsers);
router.post("/register",register);
router.post("/login",login);

router.get("/protected", authMiddleware, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});
router.post("/logout",logout);



module.exports = router;
