const express = require("express");
const router = express.Router();
const { home } = require("../controllers/homeControllers");

router.get("/", home);

module.exports = router;
