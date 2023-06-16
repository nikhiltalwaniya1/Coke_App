const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_APIKEY)
const logger = require("./logger")
const templateId = require("./mailTemplateId")
module.exports.sendMail = async (data) => {
  try {
    const msg = {
      to: data.email,
      from: 'divyeshgangwal@gmail.com',
      templateId: templateId.WELCOME_AND_PASSWORD,
      dynamicTemplateData: {
        email:data.email,
        password:data.password
      }

      // subject: 'Hello from Node.js',
      // text: 'This is a test email sent from Node.js using SendGrid.',
      // html: '<strong> and easy </strong>'
    };
    sgMail.send(msg).then(() => {
      console.log('Email sent successfully');
      return Promise.resolve('Email sent successfully')
    }).catch(error => {
      logger.error("error in send mail function line 17   ", error)
      return Promise.reject(error)
    })

  } catch (error) {
    logger.error("error in send mail function line 21   ", error)
    return Promise.reject(error)
  }
}
