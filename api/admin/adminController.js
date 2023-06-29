const { decrypt, encrypt } = require('../../utils/utill')
const { statusCode, role } = require("../../utils/constant")
const { message } = require("../../utils/message")
const users = require("../../models/users")
const masterData = require("../../models/masterdata")
const moment = require("moment")
const userResponse = require("../../response/userResponse")

module.exports.getAllAdminAllotedList = async (req, res) => {
  try {
    const userId = await decrypt(req.query.id)
    const getUserDetails = await users.findOne({ _id: userId }).lean()
    let query = ''
    let dataArray = []
    if ((getUserDetails.workingState != null && getUserDetails.workingState.length > 0) && (getUserDetails.workingCity == null) && (getUserDetails.workingArea == null)) {
      const promise1 = getUserDetails.workingState.map(async (valueOfState) => {
        const masterDatas = await masterData.find({ state: valueOfState }).lean()
        dataArray.push(...masterDatas)
        return
      })
      await Promise.all(promise1)

    } else if ((getUserDetails.workingState != null && getUserDetails.workingState.length > 0) && (getUserDetails.workingCity != null && getUserDetails.workingCity.length > 0) && (getUserDetails.workingArea == null)) {
      const promise3 = getUserDetails.workingState.map(async (valueOfState) => {
        const promise4 = getUserDetails.workingCity.map(async (valueOfCity) => {
          const masterDatas = await masterData.find({ state: valueOfState, city: valueOfCity }).lean()
          if (masterDatas && masterDatas.length > 0) {
            dataArray.push(...masterDatas)
            return
          } else {
            return
          }
        })
        await Promise.all(promise4)
        return
      })
      await Promise.all(promise3)
    } else if ((getUserDetails.workingState != null && getUserDetails.workingState.length > 0) && (getUserDetails.workingCity != null && getUserDetails.workingCity.length > 0) && (getUserDetails.workingArea != null && getUserDetails.workingCity.length > 0)) {
      const promise5 = getUserDetails.workingState.map(async (valueOfState) => {
        const promise6 = getUserDetails.workingCity.map(async (valueOfCity) => {
          const promise7 = getUserDetails.workingArea.map(async (valueOfArea) => {
            const masterDatas = await masterData.find({ state: valueOfState, city: valueOfCity, area: valueOfArea }).lean()
            if (masterDatas && masterDatas.length > 0) {
              dataArray.push(...masterDatas)
              return
            } else {
              return
            }
          })
          await Promise.all(promise7)
        })
        await Promise.all(promise6)
      })
      await Promise.all(promise5)
    }
    if (dataArray && dataArray.length > 0) {
      const promise2 = dataArray.map(async (value) => {
        value.id = await encrypt(value._id)
        const response = new masterData(value)
        return response
      })
      const resolvePromise2 = await Promise.all(promise2)
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        data: resolvePromise2
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.Data_not_found,
        data: []
      })
    }

  } catch (error) {
    console.log("error in getAllAdminAllotedList function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.getSubUserList = async (req, res) => {
  try {
    const userId = await decrypt(req.query.id)
    const allUser = await users.find({ createdBy: userId }).lean()
    if (allUser && allUser.length > 0) {
      const promise = allUser.map(async(valueOfUser)=>{
        valueOfUser.id = await encrypt(valueOfUser._id)
        const userDetails = new userResponse(valueOfUser)
        return userDetails
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
    console.log("error in getSubUserList function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.updateUserDetails = async(req, res)=>{
  try{
    const userId = await decrypt(req.body.createdBy)
    const reqObj = req.body
    const updateUserDetails = await users.updateOne({_id:userId},{$set:{
      name:reqObj.name,
      email:reqObj.email,
      workingState:reqObj.workingState,
      workingCity:reqObj.workingCity,
      workingArea:reqObj.workingArea,
      phoneNumber:reqObj.phoneNumber
    }})
    return res.send({
      status: statusCode.success,
      message: message.SUCCESS,
    })
  }catch(error){
    console.log("error in updateUserDetails function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.deleteUser = async(req, res)=>{
  try{
    const userId = await decrypt(req.query.id)
    const deleteUser = await users.deleteOne({_id:userId})
    console.log("userId", userId)
    return res.send({
      status: statusCode.success,
      message: message.SUCCESS,
    })
  }catch(error){
    console.log("error in deleteUser function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}