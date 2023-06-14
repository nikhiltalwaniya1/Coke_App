const client = require("twilio")(process.env.TWILLO_ACCOUNT_SID, process.env.TWILLO_AUTH_TOKEN);
const logger = require("./logger")

module.exports.sendOtp = async (phoneNumber) => {
  try {
    client.verify.v2.services(process.env.TWILLO_VERIFY_SID).verifications.create({
      to: `+91${phoneNumber}`, channel: "sms"
    }).then((verification) => console.log(verification.status)).then(() => {
      const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      readline.question("Please enter the OTP:", (otpCode) => {
        client.verify.v2
          .services(process.env.TWILLO_VERIFY_SID)
          .verificationChecks.create({ to: `+91${phoneNumber}`, code: otpCode })
          .then((verification_check) => console.log(verification_check.status))
          .then(() => readline.close());
      });
    });
  } catch (error) {
    logger.error("error in send otp function...", logger)
    return Promise.reject(error)
  }
}

module.exports.sendSMS = async (data) => {
  try {
    client.messages.create({
      body: `Your Password is ${data.password}`,
      from: '+14302433046',
      to: `+91${data.phoneNumber}`
    }).then(message => console.log(message.sid)).catch((error)=>{
      logger.error("error in send sms function line 34...", error)
    return Promise.reject(error)
    }) 
  } catch (error) {
    logger.error("error in send sms function...", error)
    return Promise.reject(error)
  }
}