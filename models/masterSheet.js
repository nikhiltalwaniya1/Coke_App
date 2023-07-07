const mongoose = require('mongoose');
const { Schema } = mongoose;
var mongoosePaginate = require('mongoose-paginate');

const masterSheetSchema = new Schema(
  {
    sheetName:{
      type:String,
      default:''
    },
    sheetStatus:{
      type:String,
      default:'Not Done'
    }
  },
  {
    timestamps: true,
    typecast: true,
  }
)
masterSheetSchema.plugin(mongoosePaginate);
var masterSheet = mongoose.model('mastersheetdetail', masterSheetSchema);
module.exports = masterSheet