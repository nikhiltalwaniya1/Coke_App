const express = require('express')
const router = express.Router()
const db = require('../../db_connection/connection')
const authController = require("./authController")

router.post("/login", authController.login)
router.post("/forgotpassword", authController.forgotPassword)

module.exports = router