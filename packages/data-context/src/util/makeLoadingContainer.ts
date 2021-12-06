/* eslint-disable no-dupe-class-members */
import assert from 'assert'

export type IsPending = {
  settled: false
  state: 'PENDING'
  error?: never
  value?: undefined
}

export type IsLoading<V> = {
  settled: false
  state: 'LOADING'
  promise: Promise<V>
  value?: undefined
  cancelled: boolean
}

export type IsLoaded<V> = {
  settled: true
  state: 'LOADED'
  value: V
  error?: never
}

export type IsErrored<E> = {
  settled: true
  state: 'ERRORED'
  value?: undefined
  error: E
}

export type Settled<V, E> = IsLoaded<V> | IsErrored<E>

export type LoadingState<V, E = any> = IsPending | IsLoading<V> | IsLoaded<V> | IsErrored<E>

let withinLoadingAction = false

export function assertWithinLoadingAction (name: string) {
  if (!withinLoadingAction) {
    throw new Error(`Expected ${name} to be within loading action`)
  }
}

export interface LoadingConfig<V, E = any> {
  /**
   * A name for the loding container, for any dev errors we need to trigger
   * and for the `LoadingManager` to ensure there is only a single loader with
   * the given name
   */
  name: string
  /**
   * The asynchronous action we are issuing in order to update the
   * internal state of the application
   */
  action: () => Promise<V>
  /**
   * When we move between the various states, the `onUpdate` is called to communicate
   * the current state of the loading item
   */
  onUpdate: (val: IsPending | IsLoading<V> | IsLoaded<V> | IsErrored<E>) => any
  /**
   * If there is any teardown we need to do with the resolved value, in the event
   * that we have cancelled the `LoadingContainer`, it will be invoked here
   */
  onCancelled?: (val: V) => any
}

/**
 * A "Loading Container" is a concepts which helps us model the asynchronous update
 * of a value, with the ability to re-execute, cancel in flight for the purpose of
 * test teardown.
 *
 * In our application we have a few of these: "project config",
 */
export class LoadingContainer<V, E = any> {
  /**
   * Caches the "loading" value on the class, so we can
   */
  private _loading: Promise<V> | undefined
  private _data: LoadingState<V, E>;

  constructor (private config: LoadingConfig<V, E>) {
    this._data = { state: 'PENDING', settled: false }
  }

  private async startLoading (): Promise<V> {
    const state = this._data

    assert(state.state === 'LOADING', 'Cannot call startLoading unless the value is LOADING')

    try {
      withinLoadingAction = true
      const actionVal = this.config.action()

      this._loading = actionVal

      withinLoadingAction = false

      const value = await this._loading

      if (state.cancelled) {
        try {
          await this.config.onCancelled?.(value)
        } catch (e) {
          return Promise.reject(e)
        } finally {
          return Promise.reject(new Error(`LoadingContainer: ${this.config.name} cancelled`))
        }
      }

      this._data = {
        settled: true,
        state: 'LOADED',
        value,
      }

      this.onUpdate(this._data)

      return value
    } catch (e: unknown?) {
      const errorPayload = {
        settled: true,
        state: 'ERRORED',
        error: e,
      } as IsErrored<E>

      if (state.cancelled) {
        return Promise.reject()
      }

      this._data = errorPayload

      try {
        this.onUpdate(this._data)
      } catch (e) {
        // eslint-disable-next-line
        console.error(e)
      }

      return Promise.reject(e)
    } finally {
      this._loading = undefined
      withinLoadingAction = false
    }
  }

  private onUpdate (val: IsPending | IsLoading<V> | IsLoaded<V> | IsErrored<E>) {
    this.config.onUpdate({ ...val })
  }

  reload (force = false) {
    if (this._data.state === 'LOADING' && !force) {
      return this
    }

    if (this._data.state === 'LOADING') {
      this._data.cancelled = true
    }

    this._data = { state: 'PENDING', settled: false }
    this.load()

    return this
  }

  /**
   * Loads the latest value from the "action", or "undefined" if the value is errored.
   * We resolve undefined because the error is exposed as part of the "ERRORED"
   * @param asPromise
   * @returns
   */
  load (): Promise<V | undefined> {
    if (this._data.state === 'PENDING') {
      // Explicitly sent in the next tick, as this can be dispatched from
      // the data shape updater, and we want the internal state to be consistent
      const promise = Promise.resolve().then(() => this.startLoading())

      this._data = {
        settled: false,
        state: 'LOADING',
        promise,
        cancelled: false,
      }

      this.onUpdate(this._data)

      return promise.catch(() => undefined)
    }

    if (this._data.state === 'LOADED') {
      return Promise.resolve(this._data.value)
    }

    if (this._data.state === 'ERRORED') {
      return Promise.resolve(undefined)
    }

    if (this._data.state === 'LOADING') {
      return this._data.promise.catch(() => undefined)
    }

    // @ts-expect-error
    throw new Error(`Unexpected state ${this._data.state}`)
  }

  loadOrThrow () {
    return this.load().then((val) => {
      if (val === undefined && this._data.state === 'ERRORED') {
        throw this._data.error
      }

      return val
    })
  }

  getState () {
    return this._data
  }

  reset () {
    if (this._data.state === 'LOADING') {
      this._data.cancelled = true
    }

    this._data = { state: 'PENDING', settled: false }
    this.onUpdate(this._data)

    return this
  }
}

export function makeLoadingContainer <V, E = any> (config: LoadingConfig<V, E>) {
  return new LoadingContainer(config)
}
