const logger = require("../../utils/logger")
const { encrypt, decrypt, encryptPassword, multipartyData, uploadXlsx, downloadXlsxFile, generateRandomPassword, generateOtp, removeDuplicates, clearDataBase } = require("../../utils/utill")
const { statusCode, role, status, sheetStatus } = require("../../utils/constant")
const { message } = require("../../utils/message")
const users = require("../../models/users")
const superAdminService = require("./superAdminService")
const userResponse = require("../../response/userResponse")
const masterData = require("../../models/masterdata")
const { sendSMS } = require("../../utils/sendotp")
const { sendMail } = require("../../utils/sendEmail")
const { createS3Folder } = require("../../utils/uploadFiles")
const masterSheet = require("../../models/masterSheet")
const jobs = require("../../models/jobDone")
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
    let createdby = ''
    if ((req.body.role == role.ADMIN) || (req.body.role == role.SUB_USER)) {
      createdby = await decrypt(req.body.createdBy)
    }
    if (userData == null) {
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
        createdBy: createdby
      })
      const saveUserDetails = await saveUser.save()
      if ((req.body.role == role.ADMIN) || (req.body.role == role.SUPER_ADMIN)) {
        const password = await generateRandomPassword(8)
        const encryptedPassword = await encryptPassword('12345678')
        const updatePassword = await users.updateOne({ _id: saveUserDetails._id }, { $set: { password: encryptedPassword } })
        if ((req.body.workingState != null) && (req.body.workingArea != null) && (req.body.workingCity != null) && req.body.role == role.ADMIN) {
          const updateMasterData = await superAdminService.allotteeWork(req.body.workingState, req.body.workingCity, req.body.workingArea, req.body.adminName, req.body.subUserName, saveUserDetails._id)
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
        const obj = {
          password: otp,
          phoneNumber: req.body.phoneNumber
        }
        const encryptedPassword = await encryptPassword('12345678')
        const updatePassword = await users.updateOne({ _id: saveUserDetails._id }, { $set: { password: encryptedPassword } })
        if ((req.body.workingState != null) && (req.body.workingArea != null) && (req.body.workingCity != null)) {
          const updateMasterData = await superAdminService.allotteeWork(req.body.workingState, req.body.workingCity, req.body.workingArea, req.body.adminName, req.body.subUserName, saveUserDetails._id)
        }
        // const sendOtp = await sendSMS(obj)
        return res.send({
          status: statusCode.success,
          message: message.Registration_Done
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
    const userData = await users.find({ role: { $ne: role.SUPER_ADMIN } }).limit(perPage).skip(pageNo).lean()
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
    if (multipartyDataNew.file && multipartyDataNew.file.length > 0) {
      const originalFilename = multipartyDataNew.file[0].originalFilename
      const updatedFileName = originalFilename.split('.xlsx').join("")
      const fileName = updatedFileName + "_" + Date.now()
      // Clear the database
      const clearDB = await clearDataBase()
      // Get data in array
      const sheetData = await uploadXlsx(multipartyDataNew)
      // Insert data in database
      await masterData.insertMany(sheetData)
      // Create folder in S3
      const createFolder = await createS3Folder(fileName)
      // Get data from master sheet 
      const masterSheetData = await masterSheet.findOne({ sheetStatus: sheetStatus.NOT_DONE }).lean()
      console.log("masterSheetData======", masterSheetData);
      if (masterSheetData) {
        // update master sheet
        const updateMasterSheet = await masterSheet.updateOne(
          { sheetName: updateMasterSheet.sheetName },
          {
            $set: {
              sheetName: fileName
            }
          })
      }else{
        // create master sheet
        const saveMastarSheet = new masterSheet({
          sheetName: fileName
        })
        await saveMastarSheet.save()
      }
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.SOMETHING_WENT_WRONG
      })
    }
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
    const jobsData = await jobs.find({}).lean()
    const reponse = await downloadXlsxFile(jobsData)
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
    const userId = await decrypt(req.body.id)
    console.log("userId====", userId)
    let query = ''
    if (req.body.role == role.SUPER_ADMIN) {
      query = { status: status.NOT_ALLOTTED }
    } else {
      query = { allottedUserId: userId, status: status.ALLOTTED }
    }
    const allStateData = await masterData.find(query, { _id: 0, state: 1 }).lean()
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
        const userId = await decrypt(req.body.id)
        console.log("userId=======", userId)
        let query = ''
        if (req.body.role == role.SUPER_ADMIN) {
          query = { state: valueOfState, status: status.NOT_ALLOTTED }
        } else {
          query = { allottedUserId: userId, status: valueOfState, status: status.ALLOTTED }
        }
        const allCityData = await masterData.find(query, { _id: 0, city: 1 }).lean()
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
          const userId = await decrypt(req.body.id)
          let query = ''
          if (req.body.role == role.SUPER_ADMIN) {
            query = { state: valueOfState, city: valueOfCity, status: status.NOT_ALLOTTED }
          } else {
            query = { allottedUserId: userId, state: valueOfState, city: valueOfCity, status: status.ALLOTTED }
          }
          const areaData = await masterData.find(query, { _id: 0, area: 1 }).lean()
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

    const allStateData = await masterData.find({ state: state, city: city, area: area }, { _id: 1, customerId: 0, nameofcustomer: 1 }).lean()
    if (allStateData && allStateData.length > 0) {
      // let arrayOfOutlet = []
      const promise = allStateData.map(async (valueOfOutlet) => {
        const userId = await encrypt(valueOfOutlet.customerId)
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
    // const userId = await decrypt(req.query.id)
    const userId = req.query.id
    const outletData = await masterData.find({ customerId: userId }).lean()
    if (outletData) {
      let equipmentSrNoArray = []
      let customerId = ''
      const promise = outletData.map(async (valueOfMasterData) => {
        customerId = await encrypt(valueOfMasterData.customerId)
        let equipmentObj = {
          equipmentSrNo: valueOfMasterData.equipmentSrNo,
          manufectureSrNo: valueOfMasterData.manufectureSrNo
        }
        equipmentSrNoArray.push(equipmentObj)
        return
      })
      await Promise.all(promise)
      let obj = {
        _id: await encrypt(outletData[0]._id),
        customerId: await encrypt(outletData[0].customerId),
        nameofcustomer: outletData[0].nameofcustomer,
        address: outletData[0].address,
        state: outletData[0].state,
        city: outletData[0].city,
        area: outletData[0].area,
        coolerModel: outletData[0].coolerModel,
        coolerType: outletData[0].coolerType,
        manufecture: outletData[0].manufecture,
        equipmentAndmanufecture: equipmentSrNoArray,
      }
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: obj
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

exports.getAllottedStateCityList = async (req, res) => {
  try {
    const userId = await decrypt(req.body.id)
    const state = req.body.workingState
    const city = req.body.workingCity
    const area = req.body.workingArea
    if (state && state.length > 0 && city && city.length > 0 && area && area.length > 0) {
      let states = []
      let cities = []
      let areas = []
      const promise = state.map(async (valueOfstate) => {
        const promise1 = city.map(async (valueOfcity) => {
          const promise2 = area.map(async (valueOfarea) => {
            const masterDataDetails = await masterData.findOne({
              allottedUserId: userId,
              state: valueOfstate,
              city: valueOfcity,
              area: valueOfarea,
              status: status.ALLOTTED
            }).lean()
            states.push(masterDataDetails.state)
            cities.push(masterDataDetails.city)
            areas.push(masterDataDetails.area)
            return
          })
          await Promise.all(promise2)
        })
        await Promise.all(promise1)
      })
      await Promise.all(promise)
      const finalStateArray = await removeDuplicates(states, 'state')
      const finalCityArray = await removeDuplicates(cities, 'city')
      const finalAreaArray = await removeDuplicates(areas, 'city')
      let obj = {
        state: finalStateArray,
        city: finalCityArray,
        area: finalAreaArray
      }
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: obj
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.SOMETHING_WENT_WRONG
      })
    }
    console.log("req body", req.body)
  } catch (error) {
    console.log("error in getAllottedStateCityList function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}