import pDefer from 'p-defer'
import { EventEmitter } from 'stream'
import { DataContext } from '../DataContext'
import type { CloudRun, RelevantRun } from '../gen/graphcache-config.gen'

export interface PushFragmentData {
  data: any
  errors: any
  target: string
  fragment: string
  variables?: any
  invalidateCache?: boolean
}

abstract class DataEmitterEvents {
  protected pub = new EventEmitter()

  /**
   * Emitted when we have logged in / logged out of the application
   */
  authChange () {
    this._emit('authChange')
  }

  /**
   * Emitted when an error / warning has been added / removed
   */
  errorWarningChange () {
    this._emit('errorWarningChange')
  }

  /**
   * Emitted when the checked out git branch changes
   */
  branchChange () {
    this._emit('branchChange')
  }

  /**
   * Emitted when the git info for a given spec changes
   */
  gitInfoChange (specPath: string[]) {
    this._emit('gitInfoChange', specPath)
  }

  /**
   * Emitted when we have modified part of the backend and want to show
   * a notification to possibly restart the app
   */
  devChange () {
    this._emit('devChange')
  }

  /**
   * Emitted when there is a change in the date related to refetching specs
   */
  specPollingUpdate (lastUpdated: string | null) {
    this._emit('specPollingUpdate', lastUpdated)
  }

  /**
   * Emitted when cypress.config is re-executed and we'd like to
   * either re-run a spec or update something in the App UI.
   */
  configChange () {
    this._emit('configChange')
  }

  /**
   * Emitted when we have a notification from the cloud to refresh the data
   */
  cloudViewerChange () {
    this._emit('cloudViewerChange')
  }

  /**
   * Emitted when the browserStatus field has changed due to the browser
   * having opened or closed.
   */
  browserStatusChange () {
    this._emit('browserStatusChange')
  }

  /**
   * Emitted when the specs for the current project have changed. This can
   * be due to files being added or removed or due to a change in
   * the spec pattern in the config
   */
  specsChange () {
    this._emit('specsChange')
  }

  /**
   * Emitted when then relevant run numbers changed after querying for matching
   * runs based on local commit shas
  */
  relevantRunChange (runs: RelevantRun) {
    this._emit('relevantRunChange', runs)
  }

  /**
   *
   */
  relevantRunSpecChange (run: Partial<CloudRun>) {
    this._emit('relevantRunSpecChange', run)
  }

  /**
   * Emitted when there is a change to the auto-detected framework/bundler
   * for a CT project
   */
  frameworkDetectionChange () {
    this._emit('frameworkDetectionChange')
  }

  /**
   * When we want to update the cache with known values from the server, without
   * triggering a full refresh, we can send down a specific fragment / data to update
   */
  pushFragment (toPush: PushFragmentData[]) {
    DataContext.waitForActiveRequestsToFlush().then(() => {
      this.#queuePushFragment(toPush)
    }).catch(() => {
      // This promise can never fail, it only ever resolves
    })
  }

  // Batch the "push fragment" in 10ms payloads so remotely fetched data comes in
  // with less noise to the frontend
  #timer?: NodeJS.Timer
  #toPush: PushFragmentData[] = []
  #queuePushFragment = (toPush: PushFragmentData[]) => {
    this.#toPush.push(...toPush)
    if (!this.#timer) {
      this.#timer = setTimeout(() => {
        const toPush = this.#toPush

        this.#toPush = []
        this.#timer = undefined
        this._emit('pushFragment', toPush)
      }, 10)
    }
  }

  /**
   * This should never be triggered, but fulfills the type signatures so we can subscribeTo
   * it in a situation where we want a "fake" subscription
   */
  noopChange () {
    throw new Error('Do not call this')
  }

  private _emit <Evt extends keyof DataEmitterEvents> (evt: Evt, ...args: Parameters<DataEmitterEvents[Evt]>) {
    this.pub.emit(evt, ...args)
  }
}

export type EventType = keyof DataEmitterEvents

export class DataEmitterActions extends DataEmitterEvents {
  constructor (private ctx: DataContext) {
    super()
  }

  /**
   * Broadcasts a signal to the "app" via Socket.io, typically used to trigger
   * a re-query of data on the frontend
   */
  toApp () {
    this.ctx.coreData.servers.appSocketNamespace?.emit('graphql-refetch')
    this.ctx.coreData.servers.cdpSocketNamespace?.emit('graphql-refetch')
  }

  /**
   * Broadcasts a signal to the "launchpad" (Electron GUI) via Socket.io,
   * typically used to trigger a re-query of data on the frontend
   */
  toLaunchpad () {
    this.ctx.coreData.servers.gqlSocketServer?.emit('graphql-refetch')
  }

  /**
   * Notifies the client to refetch a specific query, fired when we hit a remote data
   * source, and respond with the data before the initial hit was able to resolve
   */
  notifyClientRefetch (target: 'app' | 'launchpad', operation: string, field: string, variables: any) {
    if (target === 'app') {
      this.ctx.coreData.servers.appSocketNamespace?.emit('graphql-refetch', {
        field,
        operation,
        variables,
      })

      this.ctx.coreData.servers.cdpSocketNamespace?.emit('graphql-refetch', {
        field,
        operation,
        variables,
      })
    } else {
      this.ctx.coreData.servers.gqlSocketServer?.emit('graphql-refetch', {
        field,
        operation,
        variables,
      })
    }
  }

  /**
   * GraphQL Subscriptions use the AsyncIterator protocol for notifying
   * of updates which trigger re-execution on the client.
   * However the native syntax for async iteration: async function* () {...}
   * currently has no means for cancelling the iterator (as far as I've read):
   *   https://github.com/tc39/proposal-async-iteration/issues/126
   *
   * The graphql-ws library does properly handle the iteration, however it
   * requires that we use the raw protocol, which we have below. We assume that
   * when subscribing, we want to execute the operation to get the up-to-date initial
   * value, and then we keep a deferred object, resolved when the given emitter is fired
   *
   * @param {keyof DataEmitterEvents} evt  name of the event to subscribe to
   * @param {Object} [opts] options for the subscription
   * @param {boolean} [opts.sendInitial=false] if true, an `undefined` value will be emitted immediately before one polling cycle
   * @param {T} [opts.initialValue] this value will be emitted as the first value on the subscription immediately before one polling cycle
   * @param {(val: any) => boolean} [opts.filter] a predicate that will filter any values being passed through the subscription
   * @param {(listenerCount: number) => void} [opts.onUnsubscribe] a callback that is called each time a subscription is unsubscribed from
   *                                                               the particular event. When the `listenerCount` is zero, then there are no
   *                                                               longer any subscribers for that event
   */
  subscribeTo <T> (evt: keyof DataEmitterEvents, opts?: {sendInitial: boolean, initialValue?: T, filter?: (val: any) => boolean, onUnsubscribe?: (listenerCount: number) => void }): AsyncGenerator<T> {
    const { sendInitial = true } = opts ?? {}
    let hasSentInitial = false
    let dfd: pDefer.DeferredPromise<any> | undefined
    let pending: any[] = []
    let done = false

    function subscribed (value: any) {
      //optional filter for stream of data
      if (opts?.filter && !opts.filter(value)) {
        return
      }

      // We can get events here before next() is called setting up the deferred promise
      // If that happens, we will queue them up to be handled once next eventually is called
      if (dfd) {
        dfd.resolve({ done: false, value })
        dfd = undefined
      } else {
        pending.push({ done: false, value })
      }
    }

    // will send an initial value if supplied instead of waiting for first event
    if (opts?.initialValue) {
      pending.push({ done: false, value: opts?.initialValue })
    }

    this.pub.on(evt, subscribed)

    const iterator = {
      async next () {
        if (done) {
          return { done: true, value: undefined }
        }

        if (!hasSentInitial && sendInitial) {
          hasSentInitial = true

          return { done: false, value: undefined }
        }

        if (pending.length === 0) {
          dfd = pDefer()

          return await dfd.promise
        }

        return pending.shift()
      },
      throw: async (error: Error) => {
        throw error
      },
      return: async (): Promise<{ done: true, value: T | undefined}> => {
        this.pub.off(evt, subscribed)

        if (opts?.onUnsubscribe) {
          // the unsubscribe method can use the listener count to make
          // decisions like if a poller should be stopped if there are no
          // longer any listeners left
          opts.onUnsubscribe(this.pub.listenerCount(evt))
        }

        // If we are currently waiting on a deferred promise, we need to resolve it and signify we're done to ensure that the async loop terminates
        if (dfd) {
          dfd.resolve({ done: true, value: undefined })
        }

        done = true

        dfd = undefined

        return { done: true, value: undefined }
      },
      [Symbol.asyncIterator] () {
        return iterator
      },
    }

    return iterator
  }

  subscribeToRawEvent (evt: keyof DataEmitterEvents, listener: Parameters<EventEmitter['on']>[1]) {
    this.pub.on(evt, listener)
  }

  unsubscribeToRawEvent (evt: keyof DataEmitterEvents, listener: Parameters<EventEmitter['on']>[1]) {
    this.pub.off(evt, listener)
  }
}
