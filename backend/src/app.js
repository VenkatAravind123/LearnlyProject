require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db")
const cookieParser = require("cookie-parser");

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
app.use("/api/profile",profileRoutes);
app.use("/api/users", userRoutes);

sequelize.sync().then(() =>{
    console.log("Database connected and synchronized.");
})

app.listen(process.env.PORT || 5000, () => {
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
