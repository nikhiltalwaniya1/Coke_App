module.exports = class {
  constructor(instance) {
    this.id = instance.id ? instance.id : ''
    this.email = instance.email ? instance.email : ''
  }
}