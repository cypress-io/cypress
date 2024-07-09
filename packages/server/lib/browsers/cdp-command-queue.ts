import type ProtocolMapping from 'devtools-protocol/types/protocol-mapping'
import pDefer, { DeferredPromise } from 'p-defer'
import type { CdpCommand } from './cdp_automation'

type CommandReturn<T extends CdpCommand> = ProtocolMapping.Commands[T]['returnType']

//type DeferredPromise = { resolve: Function, reject: Function }
export type Command<T extends CdpCommand> = {
  command: T
  params?: object
  deferred: DeferredPromise<CommandReturn<T>>
  sessionId?: string
}

export class CDPCommandQueue {
  private queue: Command<any>[] = []

  public get length () {
    return this.queue.length
  }

  public get entries () {
    return [...this.queue]
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

    if (index === undefined) {
      return undefined
    }

    const [extracted] = this.queue.splice(index, 1)

    return extracted
  }

  public add <TCmd extends CdpCommand> (
    command: TCmd,
    params: ProtocolMapping.Commands[TCmd]['paramsType'][0],
    sessionId?: string,
    preventDuplicate?: boolean,
  ): Promise<CommandReturn<TCmd>> {
    if (preventDuplicate) {
      const duplicateCommand = this.queue.find((enqueued) => {
        return (
          enqueued.command === command &&
          enqueued.params === params &&
          enqueued.sessionId === sessionId
        )
      })

      if (duplicateCommand) {
        return duplicateCommand.deferred.promise
      }
    }

    const deferred = pDefer<CommandReturn<TCmd>>()

    const commandPackage: Command<TCmd> = {
      command,
      params,
      deferred,
      sessionId,
    }

    this.queue.push(commandPackage)

    return deferred.promise
  }

  public clear () {
    this.queue = []
  }

  public [Symbol.iterator] (): Iterator<Command<any>> {
    let cursor = 0

    return {
      next: (): IteratorResult<Command<any>> => {
        const value = this.queue[cursor]

        cursor++
        if (value) {
          return {
            done: false,
            value,
          }
        }

        return {
          done: true,
          value: null,
        }
      },
    }
  }
}
