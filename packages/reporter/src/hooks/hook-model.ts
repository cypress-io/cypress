import _ from 'lodash'
import { observable, computed } from 'mobx'

import { FileDetails } from '@packages/ui-components'

import { Alias } from '../instruments/instrument-model'
import { ErrModel } from '../errors/err-model'
import { CommandModel } from '../commands/command-model'
import { VirtualizableType } from '../tree/virtualizable-types'
import { VirtualNodeModel } from '../tree/virtual-node-model'
import { AttemptModel } from '../attempts/attempt-model'

export type HookName = 'before all' | 'before each' | 'after all' | 'after each' | 'test body'

export interface HookProps {
  hookId: string
  hookName: HookName
  invocationDetails?: FileDetails
}

export interface HookExtraProps {
  attempt: AttemptModel
  onCreateModel: Function
}

export class HookModel implements HookProps {
  virtualType = VirtualizableType.Hook

  @observable hookId: string
  @observable hookName: HookName
  @observable hookNumber?: number
  @observable invocationDetails?: FileDetails
  @observable invocationOrder?: number
  @observable commands: Array<CommandModel> = []
  @observable failed = false
  @observable virtualNode: VirtualNodeModel
  @observable attempt: AttemptModel

  onCreateModel: Function

  private _aliasesWithDuplicatesCache: Array<Alias> | null = null
  private _commandIndex = 0
  private _nonEventNumber = 1

  constructor (props: HookProps, extraProps: HookExtraProps) {
    this.hookId = props.hookId
    this.hookName = props.hookName
    this.invocationDetails = props.invocationDetails
    this.virtualNode = new VirtualNodeModel(`${extraProps.attempt.id}-hook-${this.hookId}-${this.hookName}`, VirtualizableType.Hook)
    this.attempt = extraProps.attempt
    this.onCreateModel = extraProps.onCreateModel
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
    command.index = this._commandIndex++

    if (!command.event) {
      command.number = this._nonEventNumber
      this._nonEventNumber++
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

    this.virtualNode.children.push(command.virtualNode)
    this.onCreateModel(command)
  }

  commandMatchingErr (errToMatch?: ErrModel) {
    if (!errToMatch) return

    return _(this.commands)
    .filter(({ err }) => {
      if (!err) return false

      return err && err.message === errToMatch.message && err.message !== undefined
    })
    .last()
  }
}
