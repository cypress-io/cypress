import { assign } from 'lodash'

export default class Usage {
  constructor (usage) {
    assign(this, usage)
  }
}
