const router = require("express").Router();
const {getUsers} = require("../controllers/adminController")
const {authMiddleware} = require("../middleware/authMiddleWare");

router.get("/getusers",authMiddleware,getUsers);
module.exports = router;