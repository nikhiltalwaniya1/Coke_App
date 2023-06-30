const logger = require("../../utils/logger")
const { encrypt, decrypt, encryptPassword, multipartyData, uploadXlsx, downloadXlsxFile, generateRandomPassword, generateOtp, removeDuplicates } = require("../../utils/utill")
const { statusCode, role, status } = require("../../utils/constant")
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
    if(userData == null){
      const saveUser = new users({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        geoLocation: req.body.geoLocation,
        workingState: req.body.workingState,
        workingCity: req.body.workingCity,
        workingArea: req.body.workingArea,
        phoneNumber: req.body.phoneNumber,
        panNumber: req.body.panNumber,
        createdBy: await decrypt(req.body.createdBy)
      })
      const saveUserDetails = await saveUser.save()
      if ((req.body.role == role.ADMIN) || (req.body.role == role.SUPER_ADMIN)) {
        const password = await generateRandomPassword(8)
        console.log("password........", password)
        const encryptedPassword = await encryptPassword('12345678')
        const updatePassword = await users.updateOne({ email: req.body.email }, { $set: { password: encryptedPassword } })
        if ((req.body.workingState != null) && (req.body.workingArea != null) && (req.body.workingCity != null)) {
          await allotteeWork(req.body.workingState, req.body.workingCity, req.body.workingArea, req.body.adminName, req.body.subUserName, saveUserDetails._id)
        }
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
        const encryptedPassword = await encryptPassword('12345678')
        const updatePassword = await users.updateOne({ _id: saveUserDetails._id }, { $set: { password: encryptedPassword } })
        if ((req.body.workingState != null) && (req.body.workingArea != null) && (req.body.workingCity != null)) {
          await allotteeWork(req.body.workingState, req.body.workingCity, req.body.workingArea, req.body.adminName, req.body.subUserName, saveUserDetails._id)
        }
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

    }else{
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
        count: count
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
    const allStateData = await masterData.find({status: status.NOT_ALLOTTED}, { _id: 0, state: 1 }).lean()
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
    const stateArray = req.body.state
    if (stateArray && stateArray.length > 0) {
      let arrayOfCity = []
      const promise = stateArray.map(async (valueOfState) => {
        const allCityData = await masterData.find({ state: valueOfState, status: status.NOT_ALLOTTED }, { _id: 0, city: 1 }).lean()
        arrayOfCity.push(...allCityData)
        return
      })
      await Promise.all(promise)
      const finalArray = await removeDuplicates(arrayOfCity, 'city')
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
    const stateArray = req.body.state
    const cityArray = req.body.city
    let arrayOfArea = []
    if (stateArray && cityArray && stateArray.length > 0 && cityArray.length > 0) {
      const promise = stateArray.map(async (valueOfState) => {
        const promise1 = cityArray.map(async (valueOfCity) => {
          const areaData = await masterData.find({ state: valueOfState, city: valueOfCity, status: status.NOT_ALLOTTED }, { _id: 0, area: 1 }).lean()
          arrayOfArea.push(...areaData)
        })
        await Promise.all(promise1)
      })
      await Promise.all(promise)
      const finalArray = await removeDuplicates(arrayOfArea, 'area')
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
    }
  } catch (error) {
    console.log("error in getAllArea function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

exports.getAllOutlet = async (req, res) => {
  try {
    const state = req.body.state
    const city = req.body.city
    const area = req.body.area

    const allStateData = await masterData.find({ state: state, city: city, area: area }, { _id: 1, nameofcustomer: 1 }).lean()
    if (allStateData && allStateData.length > 0) {
      // let arrayOfOutlet = []
      const promise = allStateData.map(async (valueOfOutlet) => {
        const userId = await encrypt(valueOfOutlet._id)
        valueOfOutlet._id = userId
        return valueOfOutlet
      })
      const resolvePromise = await Promise.all(promise)
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: resolvePromise
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

exports.getOutletDetails = async (req, res) => {
  try {
    const userId = await decrypt(req.query.id)
    const outletData = await masterData.findById({ _id: userId }).lean()
    if (outletData) {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: outletData
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Data_not_found,
        data: {}
      })
    }
  } catch (error) {
    console.log("error in getOutletDetails function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

async function allotteeWork(state, city, area, adminName, subUserName, id) {
  const promise = state.map(async (valueOfState) => {
    const promise1 = city.map(async (valueOfCity) => {
      const promise2 = area.map(async (valueOfarea) => {
        const getData = await masterData.findOne({})
        const updateMasterData = await masterData.updateOne({
          state: valueOfState,
          city: valueOfCity,
          area: valueOfarea
        },
          {
            $set: {
              allottedUserId: id,
              adminName: adminName ? adminName : '',
              subUserName: subUserName ? subUserName : '',
              status: status.ALLOTTED
            }
          })
        console.log("updateMasterData=====", updateMasterData)
        return
      })
      await Promise.all(promise2)
    })
    await Promise.all(promise1)
  })
  await Promise.all(promise)
}