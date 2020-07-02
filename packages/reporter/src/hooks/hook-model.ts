import _ from 'lodash'
import { observable, computed } from 'mobx'

import { FileDetails } from '@packages/ui-components'

import { Alias } from '../instruments/instrument-model'
import Err from '../errors/err-model'
import CommandModel from '../commands/command-model'

export type HookName = 'before all' | 'before each' | 'after all' | 'after each' | 'test body'

export interface HookProps {
  hookId: string
  hookName: HookName
  invocationDetails?: FileDetails
}

export default class Hook implements HookProps {
  @observable hookId: string
  @observable hookName: HookName
  @observable hookNumber?: number
  @observable invocationDetails?: FileDetails
  @observable invocationOrder?: number
  @observable commands: Array<CommandModel> = []
  @observable failed = false

  private _aliasesWithDuplicatesCache: Array<Alias> | null = null
  private _currentNumber = 1

  constructor (props: HookProps) {
    this.hookId = props.hookId
    this.hookName = props.hookName
    this.invocationDetails = props.invocationDetails
  }

  @computed get aliasesWithDuplicates () {
    // Consecutive duplicates only appear once in command array, but hasDuplicates is true
    // Non-consecutive duplicates appear multiple times in command array, but hasDuplicates is false
    // This returns aliases that have consecutive or non-consecutive duplicates
    let consecutiveDuplicateAliases: Array<Alias> = []
    const aliases: Array<Alias> = this.commands.map((command) => {
      if (command.alias) {
        if (command.hasDuplicates) {
          consecutiveDuplicateAliases.push(command.alias)
        }

        return command.alias
      }

      return null
    })

    const nonConsecutiveDuplicateAliases = aliases.filter((alias, i) => {
      return aliases.indexOf(alias) === i && aliases.lastIndexOf(alias) !== i
    })

    const aliasesWithDuplicates = consecutiveDuplicateAliases.concat(nonConsecutiveDuplicateAliases)

    // do a deep compare here to see if we can use the cached aliases, which will allow mobx's
    // @computed identity comparison to pass, preventing unnecessary re-renders
    // https://github.com/cypress-io/cypress/issues/4411
    if (!_.isEqual(aliasesWithDuplicates, this._aliasesWithDuplicatesCache)) {
      this._aliasesWithDuplicatesCache = aliasesWithDuplicates
    }

    return this._aliasesWithDuplicatesCache
  }

  addCommand (command: CommandModel) {
    if (!command.event) {
      command.number = this._currentNumber
      this._currentNumber++
    }

    const lastCommand = _.last(this.commands)

    if (lastCommand &&
      lastCommand.isMatchingEvent &&
      lastCommand.isMatchingEvent(command) &&
      lastCommand.addDuplicate) {
      lastCommand.addDuplicate(command)
    } else {
      this.commands.push(command)
    }
  }

  commandMatchingErr (errToMatch: Err) {
    return _(this.commands)
    .filter(({ err }) => {
      return err && err.message === errToMatch.message && err.message !== undefined
    })
    .last()
  }
}
