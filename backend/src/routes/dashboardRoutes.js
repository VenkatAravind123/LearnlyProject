const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/authMiddleWare");
const dashboardController = require("../controllers/dashboardController");

router.get("/summary", authMiddleware, dashboardController.getDashboardSummary);

module.exports = router;