const express = require("express");
const router = express.Router();
const { authMiddleware, requireRole } = require("../middleware/authMiddleWare");
const courseController = require("../controllers/courseController");

router.get("/my/enrollments",authMiddleware,courseController.getMyEnrollments);

router.get("/", authMiddleware, courseController.listCourses);
router.post("/", authMiddleware, requireRole("admin"), courseController.createCourse);

router.post("/:courseId/enroll", authMiddleware, courseController.enroll);
router.get("/:courseId/outline", authMiddleware, courseController.getCourseOutline);
router.get("/:courseId/next", authMiddleware, courseController.getNextUnit);

router.post("/:courseId/units/:unitId/quiz/submit", authMiddleware, courseController.submitUnitQuiz);


router.get("/:courseId/enrollments", authMiddleware, requireRole("admin"), courseController.getEnrollments);


module.exports = router;