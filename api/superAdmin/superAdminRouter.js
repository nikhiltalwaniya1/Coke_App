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
router.get("/alluserlistforsuperadmin", superAdminController.alluserlistforsuperadmin)
router.get("/downloadFIles", superAdminController.downloadFile)
router.get("/allDatafromMaster", superAdminController.allDatafromMaster)
router.get("/getAllState", superAdminController.getAllState)
router.get("/getAllCity", superAdminController.getAllCity)
router.get("/getAllArea", superAdminController.getAllArea)



module.exports = router