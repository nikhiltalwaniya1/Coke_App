const express = require('express')
const router = express.Router()
const db = require('../../db_connection/connection')
const middleware = require("../../utils/middleware")
const adminController = require("./adminController")

router.get("/getAllAdminAllotedList", adminController.getAllAdminAllotedList)
router.get("/getSubUserList", adminController.getSubUserList)



module.exports = router