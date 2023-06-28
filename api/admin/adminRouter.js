const express = require('express')
const router = express.Router()
const db = require('../../db_connection/connection')
const middleware = require("../../utils/middleware")
const adminController = require("./adminController")

router.get("/getAllAdminAllotedList", adminController.getAllAdminAllotedList)
router.get("/getSubUserList", adminController.getSubUserList)
router.post("/updateUserDetails", adminController.updateUserDetails)
router.delete("/deleteUser", adminController.deleteUser)



module.exports = router