require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db")
const cookieParser = require("cookie-parser");
require("./models/User");
require("./models/CompetenceTest");
require("./models/CompetenceQuestion");
require("./models/StudentProfile");
require("./models/StudentCompetence");
//Course models
require("./models/Course")
require("./models/CourseUnit")
require("./models/CourseEnrollment")
require("./models/CourseUnitQuizQuestion")
require("./models/CourseUnitQuizAttempt")


const app = express();
app.use(express.json());
app.use(cookieParser());


app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));


app.get("/", (req, res) => {
    res.send("Learning App Backend is running.");
});

const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const competenceRoutes = require("./routes/competenceRoutes");
const adminCompRoutes = require("./routes/adminCompRoutes");
const courseRoutes = require("./routes/courseRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes")
const assistantRoutes = require("./routes/assistantRoutes")
app.use("/api/profile",profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/competence", competenceRoutes);
app.use("/api/admin/competence", adminCompRoutes);
app.use("/api/courses",courseRoutes);
app.use("/api/admin/actions",adminRoutes);
app.use("/api/dashboard",dashboardRoutes);
app.use("/api/assistant",assistantRoutes);


sequelize.sync({alter:{drop:false}}).then(() =>{
    console.log("Database connected and synchronized.");
    console.log("All Models are synchronized.");
})

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
