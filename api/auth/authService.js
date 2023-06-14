module.exports.checkDetails = async (data) => {
  try {
    if (data.email) {
      null
    } else {
      return 'Enter Valid Email Address'
    }
    if (data.password) {
      null
    } else {
      return 'Enter Valid Password'
    }
  } catch (error) {
    return Promise.reject(error)
  }
}

module.exports.checkEmailisValid = async (email) => {
  try {
    // Regular expression pattern for email validation
    var emailPattern = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
    // Test the value against the pattern
    const isEmail = emailPattern.test(email);
    return isEmail
  } catch (error) {
    return Promise.reject(error)
  }
}