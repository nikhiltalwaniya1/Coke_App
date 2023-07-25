const { decrypt, encrypt, downloadXlsxFile } = require('../../utils/utill')
const { statusCode, role, status, userStatus, jobStatus, outletStatus, coolerStatus, sheetStatus } = require("../../utils/constant")
const { message } = require("../../utils/message")
const users = require("../../models/users")
const masterData = require("../../models/masterdata")
const moment = require("moment")
const userResponse = require("../../response/userResponse")
const superAdminService = require("../superAdmin/superAdminService")
const jobs = require("../../models/jobDone")
const { deleteImagesFolderFromS3, deletImageFromS3 } = require("../../utils/uploadFiles")
const masterSheet = require("../../models/masterSheet")


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
      const promise = allUser.map(async (valueOfUser) => {
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

module.exports.updateUserDetails = async (req, res) => {
  try {
    const userId = await decrypt(req.body.createdBy)
    const reqObj = req.body
    const userDetails = await users.findOne({ _id: userId }).lean()
    const updateUserDetails = await users.updateOne({ _id: userId }, {
      $set: {
        name: reqObj.name,
        workingState: reqObj.workingState,
        workingCity: reqObj.workingCity,
        workingArea: reqObj.workingArea,
        phoneNumber: reqObj.phoneNumber
      }
    })
    const updateMasterData = await superAdminService.allotteeWork(reqObj.workingState, reqObj.workingCity, reqObj.workingArea, reqObj.adminName, reqObj.subUserName, userId, userDetails.role)
    return res.send({
      status: statusCode.success,
      message: message.SUCCESS,
    })
  } catch (error) {
    console.log("error in updateUserDetails function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.deleteUser = async (req, res) => {
  try {
    const userId = await decrypt(req.query.id)
    const deleteUser = await users.deleteOne({ _id: userId })
    const updateMasterData = await masterData.updateMany({ allottedUserId: userId }, { $set: { allottedUserId: "", adminName: "", subUserName: "", status: "Not Allotted" } })
    return res.send({
      status: statusCode.success,
      message: message.SUCCESS,
    })
  } catch (error) {
    console.log("error in deleteUser function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.clearAllAllottment = async (req, res) => {
  try {
    const userId = await decrypt(req.query.id)
    const updateMasterDataList = await masterData.updateMany(
      { allottedUserId: userId },
      {
        $set: {
          adminName: null,
          subUserName: null,
          allottedUserId: null,
          status: status.NOT_ALLOTTED
        }
      }
    )
    const updateUserList = await users.updateMany(
      { _id: userId },
      {
        $set: {
          workingState: null,
          workingCity: null,
          workingArea: null,
        }
      }
    )
    return res.send({
      status: statusCode.success,
      message: message.SUCCESS,
    })
  } catch (error) {
    console.log("error in clearAllAllottment function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.transferAllotement = async (req, res) => {
  try {
    const userId = await decrypt(req.body.userId)
    const allottedUserId = await decrypt(req.body.allottedUserId)
    const transferToId = await decrypt(req.body.transferTo)
    const allottedUserDetails = await users.findOne({ _id: allottedUserId }).lean()
    const transferToDetails = await users.findOne({ _id: userId }).lean()
    const mainDetails = await users.findOne({ _id: userId }).lean()
    const removeWork = await superAdminService.removeAllottement(allottedUserId)
    const allotteWork = await superAdminService.allotteeWork(allottedUserDetails.workingState, allottedUserDetails.workingCity, allottedUserDetails.workingArea, mainDetails.name, transferToDetails.name, transferToId, allottedUserDetails.role)
    const updateUserDetails = await users.updateOne(
      { _id: transferToId },
      {
        $set: {
          workingState: allottedUserDetails.workingState,
          workingCity: allottedUserDetails.workingCity,
          workingArea: allottedUserDetails.workingArea,
        }
      }
    )
    return res.send({
      status: statusCode.success,
      message: message.SUCCESS,
    })
  } catch (error) {
    console.log("error in transferAllotement function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.blockUser = async (req, res) => {
  try {
    const userId = await decrypt(req.query.id)
    const userdetails = await users.findOne({ _id: userId })
    console.log("userdetails====", userdetails)
    if (req.query.status == userStatus.ACTIVE) {
      let query = {}
      if (userdetails.role == role.ADMIN) {
        query = {
          allottedUserId: userdetails.createdBy,
          adminName: null,
          subUserName: null,
          status: status.ALLOTTED,
        }
      } else if (userdetails.role == role.SUB_USER) {
        query = {
          allottedUserId: userdetails.createdBy,
          subUserName: null,
          status: status.ALLOTTED,
        }
      }
      const updateMasterData = await masterData.updateMany(
        { allottedUserId: userId, jobStatus: jobStatus.NOT_DONE },
        {
          $set: query
        })
      const updateUser = await users.updateOne(
        { _id: userId },
        {
          $set: {
            workingState: null,
            workingCity: null,
            workingArea: null,
            status: userStatus.INACTIVE
          }
        }
      )
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
      })
    } else if (req.query.status == userStatus.INACTIVE) {
      const updateUser = await users.updateOne(
        { _id: userId },
        {
          $set: {
            status: userStatus.ACTIVE
          }
        }
      )
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
      })
    }

  } catch (error) {
    console.log("error in blockUser function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.jobDone = async (req, res) => {
  try {
    const customerId = await decrypt(req.body.customerId)
    const jobId = await decrypt(req.body.jobId)
    const jobsData = await jobs.find({ jobId: jobId }).lean()
    switch (req.body.outletStatus) {
      case outletStatus.NOT_FOUND:
        if (jobsData && jobsData.length > 0) {
          const updateOutletStatus = await jobs.updateOne(
            { jobId: jobId },
            {
              $set: {
                outLetStatus: req.body.outletStatus,
                userId: req.body.userId,
                geoLocation: req.body.geoLocation,
                jobStatus: jobStatus.NOT_DONE
              }
            }
          )
          return res.send({
            status: statusCode.success,
            message: message.SUCCESS,
          })
        } else {
          const updateOutLetStatus = new jobs({
            customerId: customerId,
            jobId: jobId,
            outLetStatus: req.body.outletStatus,
            userId: req.body.userId,
            address: req.body.address,
            state: req.body.state,
            city: req.body.city,
            area: req.body.area,
            geoLocation: req.body.geoLocation,
            jobStatus: jobStatus.NOT_DONE
          })
          await updateOutLetStatus.save()
          return
        }
      case outletStatus.CLOSE:
        if (jobsData && jobsData.length > 0) {
          const updateJob = await jobs.updateOne(
            { jobId: jobId },
            {
              $set: {
                outletImages: req.body.outletImages,
                userId: req.body.userId,
                jobStatus: jobStatus.NOT_DONE
              }
            })
          return
        } else {
          const saveJob = new jobs({
            customerId: customerId,
            jobId: jobId,
            outLetStatus: req.body.outletStatus,
            userId: req.body.userId,
            address: req.body.address,
            state: req.body.state,
            city: req.body.city,
            area: req.body.area,
            geoLocation: req.body.geoLocation,
            jobStatus: jobStatus.NOT_DONE,
            outletImages: req.body.outletImages
          })
          const save = await saveJob.save()
          return
        }
      case outletStatus.OPEN:
        if (req.body.coolerList && req.body.coolerList.length > 0) {
          const promise = req.body.coolerList.map(async (valueOfCoolerList) => {
            if (valueOfCoolerList.coolerStatus == coolerStatus.NOT_FOUND) {
              if (jobsData && jobsData.length > 0) {
                const updateJobs = await jobs.updateOne(
                  { jobId: jobId },
                  {
                    manufectureSrNo: valueOfCoolerList.manufectureSrNo,
                    equipmentSrNo: valueOfCoolerList.equipmentSrNo,
                    remark: valueOfCoolerList.remark,
                    coolerImages: valueOfCoolerList.coolerImages,
                    geoLocation: req.body.geoLocation,
                    jobStatus: jobStatus.NOT_DONE,
                    outletImages: req.body.outletImages,
                    coolerStatus: valueOfCoolerList.coolerStatus,
                    userId: req.body.userId,
                  }
                )
                return
              } else {
                const saveJob = new jobs({
                  customerId: customerId,
                  jobId: jobId,
                  outLetStatus: req.body.outletStatus,
                  userId: req.body.userId,
                  address: req.body.address,
                  state: req.body.state,
                  city: req.body.city,
                  area: req.body.area,
                  manufectureSrNo: valueOfCoolerList.manufectureSrNo,
                  equipmentSrNo: valueOfCoolerList.equipmentSrNo,
                  remark: valueOfCoolerList.remark,
                  coolerImages: valueOfCoolerList.coolerImages,
                  geoLocation: req.body.geoLocation,
                  jobStatus: jobStatus.NOT_DONE,
                  outletImages: req.body.outletImages,
                  coolerStatus: valueOfCoolerList.coolerStatus
                })
                const save = await saveJob.save()
                return
              }
            } else if (valueOfCoolerList.coolerStatus == coolerStatus.FOUND) {
              const coolerDetails = await masterData.findOne({ equipmentSrNo: valueOfCoolerList.equipmentSrNo, manufectureSrNo: valueOfCoolerList.manufectureSrNo }).lean()
              if (coolerDetails) {
                if (jobsData && jobsData.length > 0) {
                  const updateJob = await jobs.updateOne(
                    { jobId: jobId },
                    {
                      $set: {
                        manufectureSrNo: valueOfCoolerList.manufectureSrNo,
                        equipmentSrNo: valueOfCoolerList.equipmentSrNo,
                        remark: valueOfCoolerList.remark,
                        coolerImages: valueOfCoolerList.coolerImages,
                        geoLocation: req.body.geoLocation,
                        jobStatus: jobStatus.DONE,
                        outletImages: req.body.outletImages,
                        coolerStatus: valueOfCoolerList.coolerStatus,
                        userId: req.body.userId,
                        outLetStatus: req.body.outletStatus,
                      }
                    })
                  return
                } else {
                  const saveJob = new jobs({
                    customerId: customerId,
                    jobId: jobId,
                    outLetStatus: req.body.outletStatus,
                    userId: req.body.userId,
                    address: req.body.address,
                    state: req.body.state,
                    city: req.body.city,
                    area: req.body.area,
                    manufectureSrNo: valueOfCoolerList.manufectureSrNo,
                    equipmentSrNo: valueOfCoolerList.equipmentSrNo,
                    remark: valueOfCoolerList.remark,
                    coolerImages: valueOfCoolerList.coolerImages,
                    geoLocation: req.body.geoLocation,
                    jobStatus: jobStatus.DONE,
                    outletImages: req.body.outletImages,
                    coolerStatus: valueOfCoolerList.coolerStatus
                  })
                  const save = await saveJob.save()
                  return
                }
              } else {
                if (jobsData && jobsData.length > 0) {
                  const updateJob = await jobs.updateOne(
                    { jobId: jobId },
                    {
                      $set: {
                        manufectureSrNo: valueOfCoolerList.manufectureSrNo,
                        equipmentSrNo: valueOfCoolerList.equipmentSrNo,
                        remark: valueOfCoolerList.remark,
                        coolerImages: valueOfCoolerList.coolerImages,
                        geoLocation: req.body.geoLocation,
                        jobStatus: jobStatus.DONE,
                        outletImages: req.body.outletImages,
                        coolerStatus: valueOfCoolerList.coolerStatus,
                        userId: req.body.userId,
                        outLetStatus: req.body.outletStatus,
                      }
                    })
                  return
                } else {
                  const saveJob = new jobs({
                    customerId: customerId,
                    jobId: jobId,
                    outLetStatus: req.body.outletStatus,
                    userId: req.body.userId,
                    address: req.body.address,
                    state: req.body.state,
                    city: req.body.city,
                    area: req.body.area,
                    manufectureSrNo: valueOfCoolerList.manufectureSrNo,
                    equipmentSrNo: valueOfCoolerList.equipmentSrNo,
                    remark: valueOfCoolerList.remark,
                    coolerImages: valueOfCoolerList.coolerImages,
                    geoLocation: req.body.geoLocation,
                    jobStatus: jobStatus.DONE,
                    outletImages: req.body.outletImages,
                    coolerStatus: valueOfCoolerList.coolerStatus
                  })
                  const save = await saveJob.save()
                  return
                }
              }
            }
          })
          await Promise.all(promise)
          break
        } else {
          break;
        }
      default:
        break;
    }
    return res.send({
      status: statusCode.success,
      message: message.SUCCESS
    })
  } catch (error) {
    console.log("error in jobDone function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

//This function is not in use
module.exports.jobDone1 = async (req, res) => {
  try {
    const customerId = await decrypt(req.body.customerId)
    let status = ''
    const jobsData = await jobs.find({ customerId: customerId }).lean()
    switch (req.body.outletStatus) {
      case outletStatus.NOT_FOUND:
        const updateMasterData = await masterData.updateMany(
          { customerId: customerId },
          {
            $set: {
              outletStatus: outletStatus.NOT_FOUND
            }
          }
        )
        break;
      case outletStatus.CLOSE:
        if (jobsData && jobsData.length > 0) {
          const updateJob = await jobs.updateOne(
            { customerId: customerId },
            {
              $set: {
                outletImages: req.body.outletImages,
                userId: req.body.userId,
                jobStatus: jobStatus.NOT_DONE
              }
            })
          break
        } else {
          const saveJob = new jobs({
            outletImages: req.body.outletImages,
            jobStatus: jobStatus.NOT_DONE,
            customerId: customerId,
            userId: req.body.userId,
            coolerList: []
          })
          const save = saveJob.save()
          break
        }
      case outletStatus.OPEN:
        if (req.body.coolerList && req.body.coolerList.length > 0) {
          const promise = req.body.coolerList.map(async (valueOfCooler) => {
            switch (valueOfCooler.coolerStatus) {
              case coolerStatus.NOT_FOUND:
                const updateMasterData = await masterData.updateMany(
                  { equipmentSrNo: valueOfCooler.equipmentSrNo },
                  {
                    $set: {
                      coolerStatus: coolerStatus.NOT_FOUND
                    }
                  }
                )
                break;
              case coolerStatus.FOUND:
                const coolerDetails = await masterData.findOne({ equipmentSrNo: valueOfCooler.equipmentSrNo, manufectureSrNo: valueOfCooler.manufectureSrNo }).lean()
                if (coolerDetails) {
                  if (jobsData && jobsData.length > 0) {
                    const updateJob = await jobs.updateOne(
                      { customerId: customerId },
                      {
                        $set: {
                          coolerList: req.body.coolerList,
                          userId: req.body.userId,
                          jobStatus: jobStatus.DONE
                        }
                      })
                    break
                  } else {
                    const saveJob = new jobs({
                      coolerList: req.body.coolerList,
                      jobStatus: jobStatus.DONE,
                      customerId: customerId,
                      userId: req.body.userId,
                    })
                    const save = saveJob.save()
                    break
                  }
                } else {
                  if (jobsData && jobsData.length > 0) {
                    const updateJob = await jobs.updateOne(
                      { customerId: customerId },
                      {
                        $set: {
                          coolerList: req.body.coolerList,
                          jobStatus: jobStatus.DONE,
                          userId: req.body.userId,
                        }
                      })
                    break
                  } else {
                    const saveJob = new jobs({
                      coolerList: req.body.coolerList,
                      jobStatus: jobStatus.DONE,
                      userId: req.body.userId,
                      customerId: customerId,
                    })
                    const save = saveJob.save()
                    break
                  }

                  // status = message.Details_not_matched
                  break;
                }
                console.log("coolerDetails====", coolerDetails)
                break;
              default:
                break;
            }
          })
          await Promise.all(promise)
          break
        } else {
          break;
        }
      default:
        break;
    }
    if (status === message.Details_not_matched) {
      return res.send({
        status: statusCode.error,
        message: message.Details_not_matched,
      })
    } else {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
      })
    }

  } catch (error) {
    console.log("error in jobDone1 function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.uploadImages = async (req, res) => {
  try {
    if (req.file && req.file.location) {
      return res.send({
        status: statusCode.success,
        message: message.SUCCESS,
        fileName: req.file.location
      })
    } else {
      return res.send({
        status: statusCode.error,
        message: message.File_not_upload
      })
    }
  } catch (error) {
    console.log("error in uploadImages function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.deleteImagesFolder = async (req, res) => {
  try {
    const deleteFolder = await deleteImagesFolderFromS3()
    return res.send({
      status: statusCode.success,
      message: deleteFolder,
    })
  } catch (error) {
    console.log("error in deleteImagesFolder function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}

module.exports.deleteImages = async (req, res) => {
  try {
    const deleteImage = await deletImageFromS3(req.body.imageName)
    return res.send({
      status: statusCode.success,
      message: deleteImage,
    })
  } catch (error) {
    console.log("error in deleteImagesFromS3 function ========" + error)
    return res.send({
      status: statusCode.error,
      message: message.SOMETHING_WENT_WRONG
    })
  }
}