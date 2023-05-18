const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileupload = require("express-fileupload");

// import all routes here
const home = require("./routes/home");
const user = require("./routes/user");
const product = require("./routes/product");

// for swagger documentation
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// cookies and file middleware
app.use(cookieParser());
app.use(
    fileupload({
        useTempFiles: true,
        tempFileDir: "/tmp/",
    })
);

// morgan middleware
app.use(morgan("tiny"));

// router middleware
app.use("/api/v1", home);
app.use("/api/v1", user);
app.use("/api/v1", product);

app.get("/signup", (req, res) => {
    res.render("signUpTest");
});

module.exports = app;
