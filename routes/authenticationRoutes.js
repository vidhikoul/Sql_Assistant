const express = require("express");
const router = express.Router();
const db = require('../config/db.js');
const { login, register } = require("../controllers/authControllers.js");

router.post("/login", login);

router.post("/register",register);

module.exports = router;