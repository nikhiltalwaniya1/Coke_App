const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');

const user = new Schema(
  {
    email: {
      type: String,
      default: '',
      unique: true
    },
    password: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      default: ''
    },
    geoLocation:{
      type:Object,
      default:{},
    },
    workingState: {
      type: String,
      default: ''
    },
    workingCity: {
      type: String,
      default: ''
    },
    workingArea: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      default: 'Active'
    },
    phoneNumber:{
      type: String,
      default: 0
    }
  },
  {
    timestamps: true,
    typecast: true,
  }
)

user.plugin(mongoosePaginate);
var userModel = mongoose.model('user', user);
module.exports = userModel