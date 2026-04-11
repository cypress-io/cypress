import { observable, computed, makeObservable } from 'mobx'

import type { FileDetails } from '@packages/types'

const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true

  if (a == null || b == null) return false

  if (typeof a !== typeof b) return false

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false

    return a.every((val, i) => deepEqual(val, b[i]))
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    return keysA.every((key) => deepEqual(a[key], b[key]))
  }

  return false
}
import type { Alias } from '../instruments/instrument-model'
import type Err from '../errors/err-model'
import type CommandModel from '../commands/command-model'

export type HookName = 'before all' | 'before each' | 'after all' | 'after each' | 'test body' | 'studio commands'

export interface HookProps {
  hookId: string
  hookName: HookName
  invocationDetails?: FileDetails
  isStudio?: boolean
}

export default class Hook implements HookProps {
  hookId: string
  hookName: HookName
  hookNumber?: number
  invocationDetails?: FileDetails
  invocationOrder?: number
  commands: CommandModel[] = []
  isStudio: boolean
  failed = false

  private _aliasesWithDuplicatesCache: Array<Alias> | null = null
  private _currentNumber = 1

  constructor (props: HookProps) {
    makeObservable(this, {
      hookId: observable,
      hookName: observable,
      hookNumber: observable,
      invocationDetails: observable,
      invocationOrder: observable,
      commands: observable,
      isStudio: observable,
      failed: observable,
      aliasesWithDuplicates: computed,
      hasFailedCommand: computed,
      showStudioPrompt: computed,
    })

    this.hookId = props.hookId
    this.hookName = props.hookName
    this.invocationDetails = props.invocationDetails
    this.isStudio = !!props.isStudio
  }

  get aliasesWithDuplicates () {
    // Consecutive duplicates only appear once in command array, but hasDuplicates is true
    // Non-consecutive duplicates appear multiple times in command array, but hasDuplicates is false
    // This returns aliases that have consecutive or non-consecutive duplicates
    let consecutiveDuplicateAliases: Array<Alias> = []
    const aliases: Array<Alias> = this.commands.map((command) => {
      if (command.alias) {
        if (command.hasChildren) {
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
    if (!deepEqual(aliasesWithDuplicates, this._aliasesWithDuplicatesCache)) {
      this._aliasesWithDuplicatesCache = aliasesWithDuplicates
    }

    return this._aliasesWithDuplicatesCache
  }

  get hasFailedCommand () {
    return !!this.commands.find((c) => c.state === 'failed')
  }

  get showStudioPrompt () {
    return this.isStudio && !this.hasFailedCommand && (!this.commands.length || (this.commands.length === 1 && this.commands[0].name === 'visit'))
  }

  addCommand (command: CommandModel) {
    if (!command.event && command.type !== 'system' && !this.isStudio) {
      command.number = this._currentNumber
      this._currentNumber++
    }

    if (this.isStudio && command.name === 'visit') {
      command.number = 1
    }

    if (command.group) {
      const groupCommand = this.commands.find((c) => c.id === command.group) as CommandModel

      if (groupCommand && groupCommand.addChild) {
        groupCommand.addChild(command)
      } else {
        // if we cant find a command to attach to, treat this like an ordinary log
        command.group = undefined
      }
    }

    const lastCommand = this.commands.at(-1)

    if (lastCommand &&
      lastCommand.isMatchingEvent &&
      lastCommand.isMatchingEvent(command) &&
      lastCommand.addChild
    ) {
      lastCommand.addChild(command)
    } else {
      this.commands.push(command)
    }
  }

  removeCommand (commandId: number) {
    const commandIndex = this.commands.findIndex((c) => c.id === commandId)

    this.commands.splice(commandIndex, 1)
  }

  commandMatchingErr (errToMatch: Err): CommandModel | undefined {
    return this.commands
    .filter(({ err }) => {
      return err && err.message === errToMatch.message && err.message !== undefined
    })
    .at(-1)
  }
}
