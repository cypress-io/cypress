export type Command = Record<string, any>


type TestOrSuite<T> = T extends Test ? Test : Suite
export interface Runnable {
  id: string
  type: 'suite' | 'test'
  hooks: Hook[]
}

export type TestState = 'active' | 'failed' | 'pending' | 'passed' | 'processing'

export interface Test extends Runnable {
  commands?: Command[]
  state: TestState | null
  // err?: Err
  isOpen?: boolean
  // agents?: Array<AgentProps>
  // routes?: Array<RouteProps>
  hooks: Hook[]
  prevAttempts?: Test[]
  currentRetry: number
  retries?: number
  final?: boolean
  // invocationDetails?: FileDetails
}

export interface Suite extends Runnable {
  children: (Suite | Test)[]
  suites: Suite[]
  tests: Test[]
}

export interface RootRunnable extends Suite {
}

export interface Hook {
  hookId: string
  hookName: HookName
  // invocationDetails?: FileDetails
  isStudio?: boolean
}



// import { action, computed, observable } from 'mobx'

// import Err from '../errors/err-model'
// import Instrument, { InstrumentProps } from '../instruments/instrument-model'
// import { TimeoutID } from '../lib/types'

// const LONG_RUNNING_THRESHOLD = 1000

// interface RenderProps {
//   message?: string
//   indicator?: string
// }

// export interface CommandProps extends InstrumentProps {
//   err?: Err
//   event?: boolean
//   number?: number
//   numElements: number
//   renderProps?: RenderProps
//   timeout?: number
//   visible?: boolean
//   wallClockStartedAt?: string
//   hookId: string
//   isStudio?: boolean
// }

// export default class Command extends Instrument {
//   @observable.struct renderProps: RenderProps = {}
//   @observable err = new Err({})
//   @observable event?: boolean = false
//   @observable isLongRunning = false
//   @observable number?: number
//   @observable numElements: number
//   @observable timeout?: number
//   @observable visible?: boolean = true
//   @observable wallClockStartedAt?: string
//   @observable duplicates: Array<Command> = []
//   @observable isDuplicate = false
//   @observable hookId: string
//   @observable isStudio: boolean

//   private _prevState: string | null | undefined = null
//   private _pendingTimeout?: TimeoutID = undefined

//   @computed get displayMessage () {
//     return this.renderProps.message || this.message
//   }

//   @computed get numDuplicates () {
//     // and one to include self so it's the total number of same events
//     return this.duplicates.length + 1
//   }

//   @computed get hasDuplicates () {
//     return this.numDuplicates > 1
//   }

//   constructor (props: CommandProps) {
//     super(props)

//     this.err.update(props.err)
//     this.event = props.event
//     this.number = props.number
//     this.numElements = props.numElements
//     this.renderProps = props.renderProps || {}
//     this.timeout = props.timeout
//     this.visible = props.visible
//     this.wallClockStartedAt = props.wallClockStartedAt
//     this.hookId = props.hookId
//     this.isStudio = !!props.isStudio

//     this._checkLongRunning()
//   }

//   update (props: CommandProps) {
//     super.update(props)

//     this.err.update(props.err)
//     this.event = props.event
//     this.numElements = props.numElements
//     this.renderProps = props.renderProps || {}
//     this.visible = props.visible
//     this.timeout = props.timeout

//     this._checkLongRunning()
//   }

//   isMatchingEvent (command: Command) {
//     return command.event && this.matches(command)
//   }

//   addDuplicate (command: Command) {
//     command.isDuplicate = true
//     this.duplicates.push(command)
//   }

//   matches (command: Command) {
//     return (
//       command.type === this.type &&
//       command.name === this.name &&
//       command.displayMessage === this.displayMessage
//     )
//   }

//   // the following several methods track if the command's state has been
//   // active for more than the LONG_RUNNING_THRESHOLD and set the
//   // isLongRunning flag to true, which propagates up to the test to
//   // auto-expand it
//   _checkLongRunning () {
//     if (this._becamePending()) {
//       this._startTimingPending()
//     }

//     if (this._becameNonPending()) {
//       clearTimeout(this._pendingTimeout as TimeoutID)
//     }

//     this._prevState = this.state
//   }

//   _startTimingPending () {
//     this._pendingTimeout = setTimeout(action('became:long:running', () => {
//       if (this._isPending()) {
//         this.isLongRunning = true
//       }
//     }), LONG_RUNNING_THRESHOLD)
//   }

//   _becamePending () {
//     return !this._wasPending() && this._isPending()
//   }

//   _becameNonPending () {
//     return this._wasPending() && !this._isPending()
//   }

//   _wasPending () {
//     return this._prevState === 'pending'
//   }

//   _isPending () {
//     return this.state === 'pending'
//   }
// }

export type HookName = 'before all' | 'before each' | 'after all' | 'after each' | 'test body' | 'studio commands'

export interface Hook {
  hookId: string
  hookName: HookName
  // invocationDetails?: FileDetails
  isStudio?: boolean
}

// export default class Hook implements HookProps {
//   @observable hookId: string
//   @observable hookName: HookName
//   @observable hookNumber?: number
//   @observable invocationDetails?: FileDetails
//   @observable invocationOrder?: number
//   @observable commands: CommandModel[] = []
//   @observable isStudio: boolean
//   @observable failed = false

//   private _aliasesWithDuplicatesCache: Array<Alias> | null = null
//   private _currentNumber = 1

//   constructor (props: HookProps) {
//     this.hookId = props.hookId
//     this.hookName = props.hookName
//     this.invocationDetails = props.invocationDetails
//     this.isStudio = !!props.isStudio
//   }

//   @computed get aliasesWithDuplicates () {
//     // Consecutive duplicates only appear once in command array, but hasDuplicates is true
//     // Non-consecutive duplicates appear multiple times in command array, but hasDuplicates is false
//     // This returns aliases that have consecutive or non-consecutive duplicates
//     let consecutiveDuplicateAliases: Array<Alias> = []
//     const aliases: Array<Alias> = this.commands.map((command) => {
//       if (command.alias) {
//         if (command.hasDuplicates) {
//           consecutiveDuplicateAliases.push(command.alias)
//         }

//         return command.alias
//       }

//       return null
//     })

//     const nonConsecutiveDuplicateAliases = aliases.filter((alias, i) => {
//       return aliases.indexOf(alias) === i && aliases.lastIndexOf(alias) !== i
//     })

//     const aliasesWithDuplicates = consecutiveDuplicateAliases.concat(nonConsecutiveDuplicateAliases)

//     // do a deep compare here to see if we can use the cached aliases, which will allow mobx's
//     // @computed identity comparison to pass, preventing unnecessary re-renders
//     // https://github.com/cypress-io/cypress/issues/4411
//     if (!_.isEqual(aliasesWithDuplicates, this._aliasesWithDuplicatesCache)) {
//       this._aliasesWithDuplicatesCache = aliasesWithDuplicates
//     }

//     return this._aliasesWithDuplicatesCache
//   }

//   @computed get hasFailedCommand () {
//     return !!_.find(this.commands, { state: 'failed' })
//   }

//   @computed get showStudioPrompt () {
//     return this.isStudio && !this.hasFailedCommand && (!this.commands.length || (this.commands.length === 1 && this.commands[0].name === 'visit'))
//   }

//   addCommand (command: CommandModel) {
//     if (!command.event && !this.isStudio) {
//       command.number = this._currentNumber
//       this._currentNumber++
//     }

//     if (this.isStudio && command.name === 'visit') {
//       command.number = 1
//     }

//     const lastCommand = _.last(this.commands)

//     if (lastCommand &&
//       lastCommand.isMatchingEvent &&
//       lastCommand.isMatchingEvent(command) &&
//       lastCommand.addDuplicate) {
//       lastCommand.addDuplicate(command)
//     } else {
//       this.commands.push(command)
//     }
//   }

//   removeCommand (commandId: number) {
//     const commandIndex = _.findIndex(this.commands, { id: commandId })

//     this.commands.splice(commandIndex, 1)
//   }

//   commandMatchingErr (errToMatch: Err) {
//     return _(this.commands)
//     .filter(({ err }) => {
//       return err && err.message === errToMatch.message && err.message !== undefined
//     })
//     .last()
//   }
// }


// export interface RunnableProps {
//   id: string
//   title?: string
//   hooks: Array<HookProps>
// }

// export default class Runnable {
//   @observable id: string
//   @observable shouldRender: boolean = false
//   @observable title?: string
//   @observable level: number
//   @observable hooks: Array<HookProps> = []

//   constructor (props: RunnableProps, level: number) {
//     this.id = props.id
//     this.title = props.title
//     this.level = level
//     this.hooks = props.hooks
//   }
// }


// import _ from 'lodash'
// import { observable, computed } from 'mobx'

// import { FileDetails } from '@packages/ui-components'

// import { Alias } from '../instruments/instrument-model'
// import Err from '../errors/err-model'
// import CommandModel from '../commands/command-model'

// export type HookName = 'before all' | 'before each' | 'after all' | 'after each' | 'test body' | 'studio commands'

// export interface HookProps {
//   hookId: string
//   hookName: HookName
//   invocationDetails?: FileDetails
//   isStudio?: boolean
// }

// export default class Hook implements HookProps {
//   @observable hookId: string
//   @observable hookName: HookName
//   @observable hookNumber?: number
//   @observable invocationDetails?: FileDetails
//   @observable invocationOrder?: number
//   @observable commands: CommandModel[] = []
//   @observable isStudio: boolean
//   @observable failed = false

//   private _aliasesWithDuplicatesCache: Array<Alias> | null = null
//   private _currentNumber = 1

//   constructor (props: HookProps) {
//     this.hookId = props.hookId
//     this.hookName = props.hookName
//     this.invocationDetails = props.invocationDetails
//     this.isStudio = !!props.isStudio
//   }

//   @computed get aliasesWithDuplicates () {
//     // Consecutive duplicates only appear once in command array, but hasDuplicates is true
//     // Non-consecutive duplicates appear multiple times in command array, but hasDuplicates is false
//     // This returns aliases that have consecutive or non-consecutive duplicates
//     let consecutiveDuplicateAliases: Array<Alias> = []
//     const aliases: Array<Alias> = this.commands.map((command) => {
//       if (command.alias) {
//         if (command.hasDuplicates) {
//           consecutiveDuplicateAliases.push(command.alias)
//         }

//         return command.alias
//       }

//       return null
//     })

//     const nonConsecutiveDuplicateAliases = aliases.filter((alias, i) => {
//       return aliases.indexOf(alias) === i && aliases.lastIndexOf(alias) !== i
//     })

//     const aliasesWithDuplicates = consecutiveDuplicateAliases.concat(nonConsecutiveDuplicateAliases)

//     // do a deep compare here to see if we can use the cached aliases, which will allow mobx's
//     // @computed identity comparison to pass, preventing unnecessary re-renders
//     // https://github.com/cypress-io/cypress/issues/4411
//     if (!_.isEqual(aliasesWithDuplicates, this._aliasesWithDuplicatesCache)) {
//       this._aliasesWithDuplicatesCache = aliasesWithDuplicates
//     }

//     return this._aliasesWithDuplicatesCache
//   }

//   @computed get hasFailedCommand () {
//     return !!_.find(this.commands, { state: 'failed' })
//   }

//   @computed get showStudioPrompt () {
//     return this.isStudio && !this.hasFailedCommand && (!this.commands.length || (this.commands.length === 1 && this.commands[0].name === 'visit'))
//   }

//   addCommand (command: CommandModel) {
//     if (!command.event && !this.isStudio) {
//       command.number = this._currentNumber
//       this._currentNumber++
//     }

//     if (this.isStudio && command.name === 'visit') {
//       command.number = 1
//     }

//     const lastCommand = _.last(this.commands)

//     if (lastCommand &&
//       lastCommand.isMatchingEvent &&
//       lastCommand.isMatchingEvent(command) &&
//       lastCommand.addDuplicate) {
//       lastCommand.addDuplicate(command)
//     } else {
//       this.commands.push(command)
//     }
//   }

//   removeCommand (commandId: number) {
//     const commandIndex = _.findIndex(this.commands, { id: commandId })

//     this.commands.splice(commandIndex, 1)
//   }

//   commandMatchingErr (errToMatch: Err) {
//     return _(this.commands)
//     .filter(({ err }) => {
//       return err && err.message === errToMatch.message && err.message !== undefined
//     })
//     .last()
//   }
// }





// export interface TestProps extends RunnableProps {
//   state: TestState | null
//   err?: Err
//   isOpen?: boolean
//   agents?: Array<AgentProps>
//   commands?: Array<CommandProps>
//   routes?: Array<RouteProps>
//   hooks: Array<HookProps>
//   prevAttempts?: Array<TestProps>
//   currentRetry: number
//   retries?: number
//   final?: boolean
//   invocationDetails?: FileDetails
// }

// export interface UpdatableTestProps {
//   id: TestProps['id']
//   state?: TestProps['state']
//   err?: TestProps['err']
//   hookId?: string
//   failedFromHookId?: string
//   isOpen?: TestProps['isOpen']
//   currentRetry?: TestProps['currentRetry']
//   retries?: TestProps['retries']
// }
