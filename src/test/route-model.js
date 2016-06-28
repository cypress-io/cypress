import _ from 'lodash'
import { observable } from 'mobx'
import Log from './log-model'

export default class Route extends Log {
  @observable isStubbed
  @observable method
  @observable numResponses = 0
  @observable response
  @observable status
  @observable url

  constructor (props) {
    super(props)

    this.isStubbed = props.isStubbed
    this.method = props.method
    this.numResponses = props.numResponses
    this.response = props.response
    this.status = props.status
    this.url = props.url
  }

  update (props) {
    super.update(props)

    this.isStubbed = props.isStubbed
    this.method = props.method
    this.numResponses = props.numResponses
    this.response = props.response
    this.status = props.status
    this.url = props.url
  }

  serialize () {
    return _.extend(super.serialize(), {
      isStubbed: this.isStubbed,
      method: this.method,
      numResponses: this.numResponses,
      response: this.response,
      status: this.status,
    })
  }
}
