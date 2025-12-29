const express = require("express");
const router = express.Router();
const { authMiddleware, requireRole } = require("../middleware/authMiddleWare");
const adminCompetenceController = require("../controllers/adminCompetenceController");

// Apply auth and role check to all routes
router.use(authMiddleware, requireRole("admin"));

router.post("/generate-questions", adminCompetenceController.generateAndSaveQuestions);
router.get("/tests", adminCompetenceController.getGeneratedTests);
router.delete("/tests/:testId", adminCompetenceController.deleteTest);

module.exports = router;