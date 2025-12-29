const router = require("express").Router();
const { getUsers,register,login,logout } = require("../controllers/userController");
const {authMiddleware} = require("../middleware/authMiddleWare");


router.get("/", getUsers);
router.post("/register",register);
router.post("/login",login);

router.get("/protected", authMiddleware, async(req, res) => {
  const User = require("../models/User");
  const user = await User.findByPk(req.user.userId, {
    attributes: ["id", "name", "email", "role"]
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "This is a protected route", user });
});


router.post("/logout",logout);



module.exports = router;
