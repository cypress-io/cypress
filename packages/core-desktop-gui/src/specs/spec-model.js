import { observable } from 'mobx'
import { SpecsCollection } from './specs-collection'

export default class Spec {
  @observable name
  @observable isChosen = false
  @observable children = new SpecsCollection([])

  constructor (spec) {
    this.name = spec.name
  }
}
