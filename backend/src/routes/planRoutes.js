const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleWare");
const planController = require("../controllers/planController");

router.post("/generate", authMiddleware, planController.generatePlan);
router.get("/active", authMiddleware, planController.getActivePlan);
router.post("/reschedule", authMiddleware, planController.rescheduleMissed);
router.post("/tasks/:taskId/complete", authMiddleware, planController.completeTask);
router.post("/tasks/:taskId/skip", authMiddleware, planController.skipTask);

module.exports = router;