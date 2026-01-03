const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleWare");
const assistantController = require("../controllers/assistantController");

// multipart: text + pdf/images
router.post("/chat", authMiddleware, assistantController.chatWithFiles);

module.exports = router;