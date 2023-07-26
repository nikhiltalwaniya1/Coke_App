const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');

const jobsSchema = new Schema(
  {
    customerId: {
      type: String,
      default: '',
    },
    jobId:{
      type: String,
      default: '',
      ref: "masterdata",
    },
    manufectureSrNo:{
      type: String,
      default: ''
    },
    equipmentSrNo:{
      type: String,
      default: ''
    },
    coolerStatus:{
      type: String,
      default: ''
    },
    remark:{
      type: String,
      default: ''
    },
    coolerImages:{
      type: Array,
      default: []
    },
    jobStatus:{
      type: String,
      default: ''
    },
    outletImages:{
      type: Array,
      default: []
    },
    userId:{
      type: String,
      default: '',
      ref: "users",
    },
    geoLocation: {
      type: Object,
      default: {},
    },
    outLetStatus:{
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
  },
  {
    timestamps: true,
    typecast: true,
  }
)

jobsSchema.plugin(mongoosePaginate);
var jobsData = mongoose.model('job', jobsSchema);
module.exports = jobsData