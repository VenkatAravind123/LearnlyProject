const express = require("express");
const router = express.Router();
const {authMiddleware} = require("../middleware/authMiddleWare");
const competenceController = require("../controllers/competenceController");
router.get("/test", authMiddleware, competenceController.getCompetenceTest);
router.post("/submit", authMiddleware, competenceController.submitCompetenceTest);

module.exports = router;