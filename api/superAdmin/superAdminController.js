const logger = require("../../utils/logger")
const { encrypt, decrypt, encryptPassword, multipartyData, uploadXlsx, downloadXlsxFile, generateRandomPassword, generateOtp , removeDuplicates} = require("../../utils/utill")
const { statusCode, role } = require("../../utils/constant")
const { message } = require("../../utils/message")
const users = require("../../models/users")
const superAdminService = require("./superAdminService")
const userResponse = require("../../response/userResponse")
const masterData = require("../../models/masterdata")
const { sendSMS } = require("../../utils/sendotp")
const { sendMail } = require("../../utils/sendEmail")

exports.createAdmin = async (req, res) => {
  try {
    const userValidation = await superAdminService.checkDetails(req.body)
    if (userValidation != null) {
      return res.send({
        status: statusCode.error,
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
        console.log("otp======", otp)
        const obj = {
          password: otp,
          phoneNumber: req.body.phoneNumber
        }
        const encryptedPassword = await encryptPassword(`${otp}`)
        const updatePassword = await users.updateOne({ phoneNumber: req.body.phoneNumber }, { $set: { password: encryptedPassword } })
        // const sendOtp = await sendSMS(obj)
        return res.send({
          status: statusCode.success,
          message: message.Registration_Done
        })
      } else {
        return res.send({
          status: statusCode.error,
          message: message.SOMETHING_WENT_WRONG
        })
      }
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Email_already_exist
      })
    }
  } catch (error) {
    console.log("error in createAdmin function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.alluserlistforsuperadmin = async (req, res) => {
  try {
    let perPage = req.query?.perPage ? req.query.perPage : 25;
    let page = req.query?.limit ? req.query.limit : 1;
    let pageNo = page ? (page - 1) * perPage : 0;
    const count = await users.find({}).count()
    const userData = await users.find({}).limit(perPage).skip(pageNo).lean()
    if (userData && userData.length > 0) {
      const promise = userData.map(async (value) => {
        value.id = await encrypt(value._id)
        const response = new userResponse(value)
        return response
      })
      const resolvePromise = await Promise.all(promise)
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: resolvePromise,
        count: count
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Data_not_found
      })
    }
  } catch (error) {
    console.log("error in alluserlistforsuperadmin function ========" + error)
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
    console.log("error in importfile function ========" + error)
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
    console.log("error in downloadFile function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.allDatafromMaster = async (req, res) => {
  try {
    let perPage = req.query?.perPage ? req.query.perPage : 25;
    let page = req.query?.limit ? req.query.limit : 1;
    let pageNo = page ? (page - 1) * perPage : 0;
    const count = await masterData.find({}).count()
    const masterDatas = await masterData.find({}).limit(perPage).skip(pageNo).lean()
    if (masterDatas && masterDatas.length > 0) {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: masterDatas,
        count:count
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Data_not_found,
        data: []
      })
    }
  } catch (error) {
    console.log("error in allDatafromMaster function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.getAllState = async (req, res) => {
  try {
    const allStateData = await masterData.find({}, { _id: 0, state: 1 }).lean()
    const finalArray = await removeDuplicates(allStateData, 'state')
    if (finalArray && finalArray.length > 0) {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: finalArray
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Data_not_found,
        data: []
      })
    }
  } catch (error) {
    console.log("error in getAllState function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.getAllCity = async (req, res) => {
  try {
    const allCityData = await masterData.find({ state: req.query.state }, { _id: 0, city: 1 }).lean()
    const finalArray = await removeDuplicates(allCityData, 'city')
    if (finalArray && finalArray.length > 0) {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: finalArray
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Data_not_found,
        data: []
      })
    }

  } catch (error) {
    console.log("error in getAllCity function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.getAllArea = async (req, res) => {
  try {
    const areaData = await masterData.find({ state: req.query.state, city: req.query.city }, { _id: 0, area: 1 }).lean()
    const finalArray = await removeDuplicates(areaData, 'area')
    if (finalArray && finalArray.length > 0) {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: finalArray
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Data_not_found,
        data: []
      })
    }
  } catch (error) {
    console.log("error in getAllArea function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}