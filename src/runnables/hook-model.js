import _ from 'lodash'
import { computed, observable } from 'mobx'

export default class Hook {
  @observable id
  @observable name
  @observable commands = []
  _currentNumber = 1

  constructor (props) {
    this.id = _.uniqueId('h')
    this.name = props.name
  }

  addCommand (command) {
    if (!command.event) {
      command.number = this._currentNumber
      this._currentNumber++
    }
    this.commands.push(command)
  }

  commandMatchingError (error) {
    return _(this.commands)
      .filter(({ errorMessage }) => error === errorMessage)
      .last()
  }

  @computed get failed () {
    if (this.name === 'test') return false

    return _.some(this.commands, (command) => !command.event && !!command.error)
  }
}
