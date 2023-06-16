const express = require('express')
const router = express.Router()
const db = require('../../db_connection/connection')
const superAdminController = require("./superAdminController")
const middleware = require("../../utils/middleware")

router.get('/', (err, res) => {
  res.send({
    status: 1,
    message: "Working"
  })
})
router.post("/createAdmin", superAdminController.createAdmin)
router.post("/importfile", superAdminController.importfile)
router.get("/alluserlistforsuperadmin/:perPage/:limit", superAdminController.alluserlistforsuperadmin)
router.get("/downloadFIles", superAdminController.downloadFile)
router.get("/allDatafromMaster/:perPage/:limit", superAdminController.allDatafromMaster)

module.exports = router