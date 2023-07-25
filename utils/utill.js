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
const masterData = require("../models/masterdata")
const jobs = require("../models/jobDone")

module.exports.encrypt = async (data) => {
  try {
    const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv)
    let encrypted = cipher.update(data.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return Promise.resolve(iv.toString('hex') + encrypted);
  } catch (error) {
    console.log("Error in encrypt function... " + error)
    return Promise.reject(error)
  }
}

module.exports.decrypt = async (data) => {
  try {
    const iv = Buffer.from(data.slice(0, 32), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, encryptionKey, iv);
    let decrypted = decipher.update(data.slice(32), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return Promise.resolve(decrypted);
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
  try{
    return Math.floor(
      Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
    );
  }catch(error){
    return Promise.reject(error)
  }
}

module.exports.uploadXlsx = (data) => {
  try {
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
    sheet.cell('B1').value('manufectureSrNo');
    sheet.cell('C1').value('equipmentSrNo');
    sheet.cell('D1').value('state');
    sheet.cell('E1').value('city');
    sheet.cell('F1').value('area');
    sheet.cell('G1').value('address');
    sheet.cell('H1').value('remark');
    sheet.cell('I1').value('outLetStatus');
    sheet.cell('J1').value('coolerStatus');

    if (data && data.length > 0) {
      data.forEach((val, i) => {
        const row = i + 2;
        sheet.cell(`A${row}`).value(val.customerId);
        sheet.cell(`B${row}`).value(val.manufecture);
        sheet.cell(`C${row}`).value(val.equipmentSrNo);
        sheet.cell(`D${row}`).value(val.state);
        sheet.cell(`E${row}`).value(val.city);
        sheet.cell(`F${row}`).value(val.area);
        sheet.cell(`G${row}`).value(val.address);
        sheet.cell(`H${row}`).value(val.remark);
        sheet.cell(`I${row}`).value(val.outLetStatus);
        sheet.cell(`J${row}`).value(val.coolerStatus);
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
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }
  return password;
}
// This function is use for remove duplicate entry of array
module.exports.removeDuplicateValueInArray = async (array) => {
  const newArray = [...new Set(array)]
  console.log("newArray====", newArray)
  return newArray;
}

//This function is use for remove duplicate entry of array of object
module.exports.removeDuplicates = async (array, key) => {
  const uniqueKeys = new Set();
  return array.filter((obj) => {
    if (!uniqueKeys.has(obj[key])) {
      uniqueKeys.add(obj[key]);
      return true;
    }
    return false;
  });
}

//This function is use for clear master and job done database`
module.exports.clearDataBase = async()=>{
  try{
    const deleteJobs = await jobs.deleteMany({})
    const deleteMasterData = await masterData.deleteMany({})
    return Promise.resolve('Done')
  }catch(error){
    return Promise.reject(error)
  }
}