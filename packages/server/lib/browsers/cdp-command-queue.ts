import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import pDefer, { DeferredPromise } from 'p-defer'
import type { CdpCommand } from './cdp_automation'
import Debug from 'debug'

const debug = Debug('cypress:server:browsers:cdp-command-queue')
const debugVerbose = Debug('cypress:server:browsers:cd-command-queue')

type CommandReturn<T extends CdpCommand> = ProtocolMapping.Commands[T]['returnType']

export type Command<T extends CdpCommand> = {
  command: T
  params?: object
  deferred: DeferredPromise<CommandReturn<T>>
  sessionId?: string
}

export class CDPCommandQueue {
  private queue: Command<any>[] = []

  public get entries () {
    return [...this.queue]
  }

  public add <TCmd extends CdpCommand> (
    command: TCmd,
    params: ProtocolMapping.Commands[TCmd]['paramsType'][0],
    sessionId?: string,
  ): Promise<CommandReturn<TCmd>> {
    debug('enqueing command %s', command)
    debugVerbose('enqueing command %s with params %o', command, params)

    const deferred = pDefer<CommandReturn<TCmd>>()

    const commandPackage: Command<TCmd> = {
      command,
      params,
      deferred,
      sessionId,
    }

    this.queue.push(commandPackage)

    debug('Command enqueued; new length: %d', this.queue.length)
    debugVerbose('Queue Contents: %O', this.queue)

    return deferred.promise
  }

  public clear () {
    debug('clearing command queue')
    this.queue = []
  }

  public extract<T extends CdpCommand> (search: Partial<Command<T>>): Command<T> | undefined {
    // this should find, remove, and return if found a given command

    const index = this.queue.findIndex((enqueued) => {
      for (let k of Object.keys(search)) {
        if (search[k] !== enqueued[k]) {
          return false
        }
      }

      return true
    })

    debug('extracting %o from commands at index %d', search, index)

    if (index === -1) {
      return undefined
    }

    const [extracted] = this.queue.splice(index, 1)

    return extracted
  }

  public shift () {
    return this.queue.shift()
  }

  public unshift (value: Command<any>) {
    return this.queue.unshift(value)
  }
}
