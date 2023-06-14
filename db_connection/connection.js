const db = require('mongoose')
const dotenv = require("dotenv");
dotenv.config();

const mongoURI = process.env.MONGO_URI

db.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then((result)=>{
  console.log('Database connection done...')
}).catch((err)=>{
  console.log(err)
})

module.exports = db