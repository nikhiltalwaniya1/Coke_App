const express = require('express')
const router = express.Router()
const db = require('../../db_connection/connection')
const middleware = require("../../utils/middleware")
const adminController = require("./adminController")

router.get("/getAllAdminAllotedList", adminController.getAllAdminAllotedList)
router.get("/getSubUserList", adminController.getSubUserList)
router.post("/updateUserDetails", adminController.updateUserDetails)
router.delete("/deleteUser", adminController.deleteUser)
router.get("/clearAllAllottment", adminController.clearAllAllottment)
router.post("/transferAllotement", adminController.transferAllotement)
router.post("/jobDone", adminController.jobDone)
router.get("/blockUser", adminController.blockUser)






module.exports = router