const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const JobRoute = require("./routes/JobRoute");
const CompanyRoute = require("./routes/CompanyRoutes");
const usersRoute = require("./routes/userRoute");
const additionalQuestionsRoute = require("./routes/additionalQuestionsRoutes");
const auth = require("./middlewares/auth");
const savedJobRoutes = require("./routes/savedJobsRoute");
const appliedJobsRoute = require("./routes/appliedJobsRoute"); 
const upload =require("./routes/upload")
const cookieParser = require('cookie-parser');

app.use(
  cors({
    origin: "*",
    credentials: true,
    allowedHeaders:
      "Origin, X-Requested-With, Content-Type, Accept, Authorization , 'User-Id'",
    methods: "GET, POST, PATCH, DELETE, OPTIONS, PUT",
  })
);


app.use(express.json());
app.use("/users", usersRoute);
app.use("/jobs", JobRoute);
app.use("/additionalQuestions", additionalQuestionsRoute);
app.use("/companies", CompanyRoute);
app.use("/savedJobs", savedJobRoutes);
app.use("/appliedJobs", appliedJobsRoute);
app.use("/upload", upload);
app.use(cookieParser());

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log("Server started at Port", process.env.PORT);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
