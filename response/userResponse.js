module.exports = class {
  constructor(instance) {
    this.name = instance.name ? instance.name : ''
    this.id = instance.id ? instance.id : ''
    this.email = instance.email ? instance.email : ''
    this.geoLocation = instance.geoLocation ? instance.geoLocation : ''
    this.role = instance.role ? instance.role : ''
    this.workingState = instance.workingState ? instance.workingState : ''
    this.workingCity = instance.workingCity ? instance.workingCity : ''
    this.workingArea = instance.workingArea ? instance.workingArea : ''
    this.phoneNumber = instance.phoneNumber ? instance.phoneNumber : ''
    this.status = instance.status ? instance.status : '' 
    this.token = instance.token ? instance.token : ''
    this.panNumber = instance.panNumber ? instance.panNumber : ''
  }
}