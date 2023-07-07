const AWS = require("aws-sdk");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const multer = require('multer');
const multerS3 = require('multer-s3');
const masterSheet = require("../models/masterSheet")
const {sheetStatus} = require("../utils/constant")
const S3 = new AWS.S3({
  region: "ap-northeast-1",
  accessKeyId: "AKIAYVDHKSALDPPSFRLH",
  secretAccessKey: "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",

  signatureVersion: "v4",
});
const config = {
  credentials: {
    accessKeyId: "AKIAYVDHKSALDPPSFRLH",
    secretAccessKey: "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",
  },
  region: "ap-northeast-1",
};
const client = new S3Client(config);

const bucketName = "cokeappdev"

module.exports.upload = async(req, res, next)=>{
  const getFolderName = await masterSheet.findOne({sheetStatus:sheetStatus.NOT_DONE}).lean()
  const uploads = multer({
    storage: multerS3({
      s3: client,
      bucket: bucketName,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      // acl: 'public-read',
      key: function (req, file, cb) {
        console.log('file==', file)
        const folderName = getFolderName.sheetName
        const uniqueKey = file.originalname
        const filePath = folderName+'/'+uniqueKey
        cb(null, filePath); // Use a unique key for the file in S3
      }
    })
  }).single("file");
  uploads(req, res, function (error) {    
    if (error) {
      console.error('Error uploading file:', error);
      // Handle the error here (e.g., sending an error response)
    } else {
      // The file was uploaded successfully
      next();
    }
  });
}

exports.createS3Folder = async (folderName) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: folderName + '/',
      Body: ''
    };
    await S3.upload(params).promise();
    console.log(`Successfully created folder: ${folderName}`);
    return Promise.resolve(`Successfully created folder: ${folderName}`)
  } catch (error) {
    console.log("error in createS3Folder function =======", error);
    return Promise.reject("error in createS3Folder function =======", error)
  }
}

exports.deleteImagesFolderFromS3 = async () => {
  try {
    const getFolderName = await masterSheet.findOne({sheetStatus:sheetStatus.NOT_DONE}).lean()
    const folderName = getFolderName.sheetName
    const params = {
      Bucket: bucketName,
      Prefix: folderName
    };
    const objects = await S3.listObjectsV2(params).promise();
    if (objects.Contents.length === 0) {
      console.log(`Folder doesn't exist: ${folderName}`);
      return Promise.resolve(`Folder doesn't exist: ${folderName}`);
    }
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
      }
    };
    await S3.deleteObjects(deleteParams).promise();
    return Promise.resolve(`Successfully deleted folder: ${folderName}`)
  } catch (error) {
    console.log("error in deleteImagesFolderFromS3 function =======", error);
    return Promise.reject("error in deleteImagesFolderFromS3 function =======", error)
  }
}

exports.deletImageFromS3 = async(imageName)=>{
  try{
    const breakImageName = imageName.split("/")
    const folderName = breakImageName[3]
    const newImageName = breakImageName[4]
    const params = {
      Bucket: bucketName,
      Key: folderName + '/' + newImageName
    };
    await S3.deleteObject(params).promise();
    return Promise.resolve(`Successfully deleted image`)
  }catch(error){
    console.log("error in deletImageFromS3 function =======", error);
    return Promise.reject("error in deletImageFromS3 function =======", error)
  }
}