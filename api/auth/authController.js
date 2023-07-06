const logger = require("../../utils/logger")
const { encrypt, decrypt, encryptPassword, comparePassword, createToken, generateOtp, uploadXlsx, generateRandomPassword } = require("../../utils/utill")
const { statusCode, role } = require("../../utils/constant")
const { message } = require("../../utils/message")
const authService = require("./authService")
const userResponse = require("../../response/userResponse")
const {sendSMS} = require("../../utils/sendotp")
const { sendMail } = require("../../utils/sendEmail")
const users = require("../../models/users")

module.exports.login = async (req, res) => {
  try {
    console.log("working");
    const checkDetails = await authService.checkDetails(req.body)
    if (checkDetails != null) {
      return res.send({
        status: statusCode.error,
        message: checkDetails
      })
    }
    const isEmailVaild = isNaN(req.body.email)
    let query = ''
    if (isEmailVaild) {
      const checkVaildations = await authService.checkEmailisValid(req.body.email)
      if (checkVaildations) {
        query = { email: req.body.email }
      } else {
        return res.send({
          status: statusCode.error,
          message: message.Email_not_exist
        })
      }
    } else {
      query = { phoneNumber: req.body.email }
    }
    const userData = await users.findOne(query).lean()
    if (userData) {
      const checkPassword = await comparePassword(userData.password, req.body.password)
      if (checkPassword) {
        delete (userData.password)
        const token = await createToken(userData)
        userData.token = token
        userData.id = await encrypt(userData._id)
        const response = new userResponse(userData)
        return res.send({
          status: statusCode.success,
          message: message.SUCCESS,
          data: response
        })
      } else {
        return res.send({
          status: statusCode.error,
          message: message.Password_not_match
        })
      }
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Email_not_exist
      })
    }
  } catch (error) {
    console.log("error in login========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.forgotPassword = async (req, res) => {
  try {
    const isEmailVaild = isNaN(req.body.email)
    let query = ''
    if (isEmailVaild) {
      const checkVaildations = await authService.checkEmailisValid(req.body.email)
      if (checkVaildations) {
        query = { email: req.body.email }
      } else {
        return res.send({
          status: statusCode.error,
          message: message.Email_not_exist
        })
      }
    } else {
      query = { phoneNumber: req.body.email }
    }
    const userData = await users.findOne(query).lean()
    if (userData) {
      if ((userData.role == role.ADMIN) || (userData.role == role.SUPER_ADMIN)) {
        const password = await generateRandomPassword(8)
        const encryptedPassword = await encryptPassword(password)
        const updatePassword = await users.updateOne({_id:userData._id},{$set:{password:encryptedPassword}})
        let obj = {
          email: req.body.email,
          password:password
        }
        const mailSended = await sendMail(obj)
        return res.send({
          status: statusCode.success,
          message: message.Password_Sended
        })
      }else if (userData.role == role.SUB_USER) {
        const otp = await generateOtp(6)
        const obj = {
          password: otp,
          phoneNumber:req.body.email
        }
        const encryptedPassword = await encryptPassword(`${otp}`)
        const updatePassword = await users.updateOne({_id:userData._id},{$set:{password:encryptedPassword}})
        const sendOtp = await sendSMS(obj)
        return res.send({
          status: statusCode.success,
          message: message.Password_Sended
        })
      } else {
        return res.send({
          status: statusCode.error,
          message: message.message.SOMETHING_WENT_WRONG
        })
      }
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Email_not_exist
      })
    }
  } catch (error) {
    console.log("error in forgotPassword========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}