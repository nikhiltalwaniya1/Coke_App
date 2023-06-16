const cron = require('node-cron');
const logger = require("../utils/logger")
const users = require('../models/users')
const moment = require('moment')

module.exports.dailySendMail = async () => {
  try {
    cron.schedule('0 0 * * *', async () => {
      const currentTime = moment().format()
      const userData = await users.find({}).lean()
      console.log("Cron is working...")
      const promise = userData.map(async (value) => {
        const after7DaysTime = moment(value.created_at).add(7, 'days').format()
        if (currentTime == after7DaysTime) {
          console.log("currentTime", currentTime)
          
        }else{
          console.log("after7DaysTime", after7DaysTime)
          return Promise.resolve(null)

        }

      })
      await Promise.all(promise)

    })
  } catch (error) {
    logger.error("error in dailySendMail function ========" + error)
    return Promise.reject(error)
  }
}