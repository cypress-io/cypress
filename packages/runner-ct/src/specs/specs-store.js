import { observable, action } from 'mobx'

export class SpecsStore {
  @observable specs = []

  @action setSpecs (specs) {
    console.log('setSpecs')
    this.specs = specs
  }
}

export default new SpecsStore()
