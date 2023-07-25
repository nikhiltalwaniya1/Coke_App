const logger = require("../../utils/logger")
const users = require("../../models/users")
const masterData = require("../../models/masterdata")
const { status, role } = require("../../utils/constant")

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
    const userData = await users.findOne({ userId: email }).lean()
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

module.exports.allotteeWork = async (state, city, area, adminName, subUserName, id, roleId) => {
  try {
    if ((state && state.length > 0) && (city && city.length > 0) && (area && area.length > 0)) {
      const promise = state.map(async (valueOfState) => {
        const promise1 = city.map(async (valueOfCity) => {
          const promise2 = area.map(async (valueOfarea) => {
            let query = {}
            if (roleId == role.ADMIN) {
              query = {
                allottedUserId: id,
                adminName: adminName ? adminName : '',
                status: status.ALLOTTED
              }
            } else if (roleId == role.SUB_USER) {
              query = {
                allottedUserId: id,
                subUserName: subUserName ? subUserName : '',
                status: status.ALLOTTED
              }
            }
            console.log("query====", query)
            const updateMasterData = await masterData.updateOne({
              state: valueOfState,
              city: valueOfCity,
              area: valueOfarea
            },
              {
                $set: query
              })
            return
          })
          await Promise.all(promise2)
        })
        await Promise.all(promise1)
      })
      await Promise.all(promise)
      return
    } else {
      return
    }
  } catch (error) {
    console.log("error== in allotteeWork====", error);
    return Promise.reject(error)
  }
}

module.exports.removeAllottement = async (userId) => {
  try {
    const clearWork = await masterData.updateMany(
      { allottedUserId: userId },
      {
        $set: {
          allottedUserId: null,
          adminName: null,
          subUserName: null,
          status: status.NOT_ALLOTTED
        }
      }
    )
    const updateUser = await users.updateMany(
      { _id: userId },
      {
        $set: {
          workingState: null,
          workingCity: null,
          workingArea: null
        }
      }
    )
    return Promise.resolve("Remove Allotment")
  } catch (error) {
    console.log("error== in clearWork====", error);
    return Promise.reject(error)
  }
}