const logger = require("../../utils/logger")
const users = require("../../models/users")
const masterData = require("../../models/masterdata")
const { status } = require("../../utils/constant")

module.exports.checkDetails = async (data, cb) => {
  try {
    if (data.email) {
      null
    } else {
      return 'Enter Valid Email Address'
    }
    if (data.role) {
      null
    } else {
      return 'Enter Valid Role'
    }

  } catch (error) {
    return Promise.reject(error)
  }
}

module.exports.userDetails = async (email) => {
  try {
    const userData = await users.findOne({ email: email }).lean()
    if (userData) {
      return Promise.resolve(userData)
    } else {
      return Promise.resolve(null)
    }
  } catch (error) {
    console.log
    return Promise.reject(error)
  }
}

module.exports.allotteeWork = async (state, city, area, adminName, subUserName, id) => {
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