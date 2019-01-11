import _ from 'lodash'
import { observable, computed } from 'mobx'

export default class Hook {
  @observable id
  @observable name
  @observable commands = []
  @observable failed = false
  _currentNumber = 1

  constructor (props) {
    this.id = _.uniqueId('h')
    this.name = props.name
  }

  @computed get aliasesWithDuplicates () {
    const aliases = this.commands.map((command) => {
      return command.alias
    })

    return aliases.filter((alias, i) => {
      return aliases.indexOf(alias) === i && aliases.lastIndexOf(alias) !== i
    })
  }

  addCommand (command) {
    if (!command.event) {
      command.number = this._currentNumber
      this._currentNumber++
    }

    const lastCommand = _.last(this.commands)

    if (lastCommand && lastCommand.isMatchingEvent(command)) {
      lastCommand.addDuplicate(command)
    } else {
      this.commands.push(command)
    }
  }

  commandMatchingErr (errToMatch) {
    return _(this.commands)
    .filter(({ err }) => {
      return err.displayMessage === errToMatch.displayMessage
    })
    .last()
  }
}
