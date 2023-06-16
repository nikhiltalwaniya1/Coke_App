const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const superAdminRouter = require("./api/superAdmin/superAdminRouter")
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./coke_app_swagger.json");
const authRouter = require("./api/auth/authRouter")
const {dailySendMail} = require("./crons/rundailycron")

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use("/cake-app-api",swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use("/api/v1/superadmin", superAdminRouter);
app.use("/api/v1/auth", authRouter);

dailySendMail()

app.listen(process.env.PORT, ()=>{
  console.log('server started....', process.env.PORT)
})
