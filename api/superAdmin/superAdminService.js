const logger = require("../../utils/logger")
const users = require("../../models/users")

module.exports.checkDetails = async(data, cb)=>{
  try{
    if(data.email){
      null
    }else{
      return 'Enter Valid Email Address'
    }
    if(data.role){
      null
    }else{
      return 'Enter Valid Role'
    }

  }catch(error){
    return Promise.reject(error)
  }
}

module.exports.userDetails = async(email)=>{
  try{
    const userData = await users.findOne({ email: email }).lean()
    if(userData){
      return Promise.resolve(userData)
    }else{
      return Promise.resolve(null)
    }
  }catch(error){
    logger.error
    return Promise.reject(error)
  }
}