const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');

const jobsSchema = new Schema(
  {
    customerId: {
      type: String,
      default: ''
    },
    coolerList: [
      {
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
      }
    ],
    jobId:{
      type: String,
      default: ''
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
      default: ''
    }
  },
  {
    timestamps: true,
    typecast: true,
  }
)

jobsSchema.plugin(mongoosePaginate);
var jobsData = mongoose.model('job', jobsSchema);
module.exports = jobsData