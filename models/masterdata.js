const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');

const masterdata = new Schema(
  {
    customerId: {
      type: String,
      default: '',
    },
    nameofcustomer: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    area: {
      type: String,
      default: ''
    },
    coolerModel: {
      type: String,
      default: ''
    },
    coolerType: {
      type: String,
      default: ''
    },
    manufecture: {
      type: String,
      default: ''
    },
    equipmentSrNo: {
      type: String,
      default: ''
    },
    manufectureSrNo: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    typecast: true,
  }
)

masterdata.plugin(mongoosePaginate);
var masterdatas = mongoose.model('masterdata', masterdata);
module.exports = masterdatas