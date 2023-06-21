const logger = require("./logger")
const encryptionKey = process.env.ENCRYPTIONKEY
const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; //Using AES encryption
const iv = crypto.randomBytes(16);
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')
const Multiparty = require("multiparty");
const xlsx = require('xlsx');
const XlsxPopulate = require('xlsx-populate');

module.exports.encrypt = async (data) => {
  try {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
    let encrypted = cipher.update(data.toString());
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const encryptedId = encrypted.toString('hex')
    return Promise.resolve(encryptedId)
  } catch (error) {
    console.log("Error in encrypt function... " + error)
    return Promise.reject(error)
  }
}

module.exports.decrypt = async (data) => {
  try {
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let encryptedText = Buffer.from(data, 'hex');
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return Promise.resolve(decrypted.toString());
  } catch (error) {
    console.log("Error in decrypt function... ", error)
    console.log("Error in decrypt function... " + error)
    return Promise.reject(error)
  }
}

module.exports.encryptPassword = async (password) => {
  try {
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err1, hash) => {
        if (err1) {
          console.log("Error in encryptPassword function line 40... " + err1)
          reject(err1)
        }
        resolve(hash)
      })
    })
  } catch (error) {
    console.log("Error in encryptPassword function... ", error)
    console.log("Error in encryptPassword function... " + error)
    return Promise.reject(error)
  }
}

module.exports.comparePassword = async (password, newPassword) => {
  try {
    return new Promise(async (resolve, reject) => {
      const result = await bcrypt.compare(newPassword, password)
      resolve(result)
    })
  } catch (error) {
    return Promise.reject(error)
  }
}

module.exports.createToken = async (userData) => {
  return new Promise((resolve, reject) => {
    const token = jwt.sign(userData, process.env.TOKEN_KEY, { expiresIn: "24h" })
    resolve(token)
  })
}

module.exports.generateOtp = (length) => {
  return Math.floor(
    Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
  );
}

module.exports.uploadXlsx = (data) => {
  try {
    console.log("data.....", data.file[0].path)
    const workbook = xlsx.readFile(data.file[0].path);
    const sheetName = workbook.SheetNames[0]; // Assuming the data is in the first sheet
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return Promise.resolve(sheetData)
  } catch (error) {
    return Promise.reject(error)
  }
}

module.exports.multipartyData = async (req) => {
  return new Promise((resolve, reject) => {
    const form = new Multiparty.Form();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        resolve({
          fields: null,
          files: null,
        });
      }
      resolve(files);
    })
  })
}

module.exports.downloadXlsxFile = async (data) => {
  try {
    const workbook = await XlsxPopulate.fromBlankAsync();
    const sheet = workbook.sheet("Sheet1");
    // Set cell values
    sheet.cell('A1').value('customerId');
    sheet.cell('B1').value('nameofcustomer');
    sheet.cell('C1').value('address');
    sheet.cell('D1').value('state');
    sheet.cell('E1').value('city');
    sheet.cell('F1').value('area');
    sheet.cell('G1').value('coolerModel');
    sheet.cell('H1').value('coolerType');
    sheet.cell('I1').value('manufecture');
    sheet.cell('J1').value('equipmentSrNo');
    sheet.cell('K1').value('manufectureSrNo');

    if (data && data.length > 0) {
      data.forEach((val, i) => {
        const row = i + 2;
        sheet.cell(`A${row}`).value(val.customerId);
        sheet.cell(`B${row}`).value(val.nameofcustomer);
        sheet.cell(`C${row}`).value(val.address);
        sheet.cell(`D${row}`).value(val.state);
        sheet.cell(`E${row}`).value(val.city);
        sheet.cell(`F${row}`).value(val.area);
        sheet.cell(`G${row}`).value(val.coolerModel);
        sheet.cell(`H${row}`).value(val.coolerType);
        sheet.cell(`I${row}`).value(val.manufecture);
        sheet.cell(`J${row}`).value(val.equipmentSrNo);
        sheet.cell(`K${row}`).value(val.manufectureSrNo);
      });
    }
    const fileData = await workbook.outputAsync();
    return fileData;
  } catch (error) {
    console.log("error in downloadxlsxfile function line 118  ", error)
    return Promise.reject(error)
  }
}

module.exports.generateRandomPassword = async (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
}