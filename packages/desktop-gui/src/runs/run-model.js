import { assign } from 'lodash'
import { observable, makeObservable } from 'mobx'

export default class Run {
  id;

  constructor (options) {
    makeObservable(this, {
      id: observable,
    })

    assign(this, options)
  }
}
