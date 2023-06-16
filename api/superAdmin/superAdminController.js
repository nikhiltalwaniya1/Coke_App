const logger = require("../../utils/logger")
const { encrypt, decrypt, encryptPassword, multipartyData, uploadXlsx, downloadXlsxFile, generateRandomPassword, generateOtp } = require("../../utils/utill")
const { statusCode, role } = require("../../utils/constant")
const { message } = require("../../utils/message")
const users = require("../../models/users")
const superAdminService = require("./superAdminService")
const userListResponse = require("../../response/userlistResponse")
const masterData = require("../../models/masterdata")
const { sendSMS } = require("../../utils/sendotp")
const { sendMail } = require("../../utils/sendEmail")

exports.createAdmin = async (req, res) => {
  try {
    const userValidation = await superAdminService.checkDetails(req.body)
    if (userValidation != null) {
      return res.send({
        status: statusCode.success,
        message: userValidation
      })
    }
    const userData = await superAdminService.userDetails(req.body.email)
    if (userData == null) {
      const saveUser = new users({
        email: req.body.email,
        role: req.body.role,
        geoLocation: req.body.geoLocation,
        workingState: req.body.workingState,
        workingCity: req.body.workingCity,
        workingArea: req.body.workingArea,
        phoneNumber: req.body.phoneNumber,
        panNumber: req.body.panNumber,
      })
      await saveUser.save()
      if ((req.body.role == role.ADMIN) || (req.body.role == role.SUPER_ADMIN)) {
        const password = await generateRandomPassword(8)
        console.log("password........", password)
        const encryptedPassword = await encryptPassword(password)
        const updatePassword = await users.updateOne({ email: req.body.email }, { $set: { password: encryptedPassword } })
        let obj = {
          email: req.body.email,
          password: password
        }
        const mailSended = await sendMail(obj)
        return res.send({
          status: statusCode.success,
          message: message.Registration_Done
        })
      } else if (req.body.role == role.SUB_USER) {
        const otp = await generateOtp(6)
        const obj = {
          password: otp,
          phoneNumber: req.body.phoneNumber
        }
        const encryptedPassword = await encryptPassword(`${otp}`)
        const updatePassword = await users.updateOne({ phoneNumber: req.body.phoneNumber }, { $set: { password: encryptedPassword } })
        const sendOtp = await sendSMS(obj)
        return res.send({
          status: statusCode.success,
          message: message.Registration_Done
        })
      } else {
        return res.send({
          status: statusCode.success,
          message: message.SOMETHING_WENT_WRONG
        })
      }
    } else {
      return res.send({
        status: statusCode.success,
        message: message.Email_already_exist
      })
    }
  } catch (error) {
    logger.error("error in createAdmin function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.alluserlistforsuperadmin = async (req, res) => {
  try {
    let perPage = req.params?.perPage ? req.params.perPage : 25;
    let page = req.params?.limit ? req.params.limit : 1;
    let pageNo = page ? (page - 1) * perPage : 0;
    const userData = await users.find({}).limit(perPage).skip(pageNo).lean()
    if (userData && userData.length > 0) {
      const promise = userData.map(async (value) => {
        value.id = await encrypt(value._id)
        const response = new userListResponse(value)
        return response
      })
      const resolvePromise = await Promise.all(promise)
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: resolvePromise
      })
    } else {
      return res.send({
        status: statusCode.success,
        message: message.Data_not_found
      })
    }
  } catch (error) {
    logger.error("error in alluserlistforsuperadmin function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.importfile = async (req, res) => {
  try {
    const multipartyDataNew = await multipartyData(req)
    const sheetData = await uploadXlsx(multipartyDataNew)
    await masterData.insertMany(sheetData)
    return res.send({
      status: statusCode.success,
      message: message.SUCCESS
    })
  } catch (error) {
    logger.error("error in importfile function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.downloadFile = async (req, res) => {
  try {
    const masterSheetData = await masterData.find({}).lean()
    console.log("masterSheetData", masterSheetData)
    const reponse = await downloadXlsxFile(masterSheetData)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');
    return res.send(reponse)
  } catch (error) {
    logger.error("error in downloadFile function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.allDatafromMaster = async (req, res) => {
  try {
    let perPage = req.params?.perPage ? req.params.perPage : 25;
    let page = req.params?.limit ? req.params.limit : 1;
    let pageNo = page ? (page - 1) * perPage : 0;
    const masterDatas = await masterData.find({}).limit(perPage).skip(pageNo).lean()
    if (masterDatas && masterDatas.length > 0) {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: masterDatas
      })
    } else {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: []
      })
    }
  } catch (error) {
    logger.error("error in allDatafromMaster function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}