module.exports = class {
  constructor(instance) {
    this.id = instance.id ? instance.id : ''
    this.customerId = instance.customerId ? instance.customerId : ''
    this.nameofcustomer = instance.nameofcustomer ? instance.nameofcustomer : ''
    this.address = instance.address ? instance.address : ''
    this.state = instance.state ? instance.state : ''
    this.city = instance.city ? instance.city : ''
    this.area = instance.area ? instance.area : ''
    this.coolerModel = instance.coolerModel ? instance.coolerModel : ''
    this.coolerType = instance.coolerType ? instance.coolerType : ''
    this.manufecture = instance.manufecture ? instance.manufecture : ''
    this.equipmentSrNo = instance.equipmentSrNo ? instance.equipmentSrNo : ''
    this.manufectureSrNo = instance.manufectureSrNo ? instance.manufectureSrNo : ''
  }
}