/* eslint-disable no-dupe-class-members */
import assert from 'assert'
import type { Immutable } from 'immer'

export type IsPending = {
  settled: false
  state: 'PENDING'
  error?: never
  value?: undefined
}

export type IsLoading<V, E = any> = {
  settled: false
  state: 'LOADING'
  promise: Promise<Settled<Immutable<V>, E>>
  value?: undefined
  cancelled: boolean
}

export type IsLoaded<V> = {
  settled: true
  state: 'LOADED'
  value: Immutable<V>
  error?: never
}

export type IsErrored<E> = {
  settled: true
  state: 'ERRORED'
  value?: undefined
  error: E
}

export type Settled<V, E> = IsLoaded<V> | IsErrored<E>

export type LoadingState<V, E = any> = IsPending | IsLoading<V, E> | IsLoaded<V> | IsErrored<E>

let withinLoadingAction = false

export function assertWithinLoadingAction (name: string) {
  if (!withinLoadingAction) {
    throw new Error(`Expected ${name} to be within loading action`)
  }
}

export interface LoadingConfig<V, E = any> {
  /**
   * A name for the loding container, for any dev errors we need to trigger
   */
  name: string
  /**
   * The action to take to update the value
   */
  action: () => Promise<Immutable<V>>
  /**
   * When we update the value
   */
  onUpdate: (val: Immutable<IsLoaded<V> | IsErrored<E>>) => any
  /**
   * Called when we call "reload" on the
   */
  onReload?: () => {}
  /**
   * Optional callback after there's an error
   */
  onError?: (err: E) => void
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
  private _loading: Promise<Immutable<V>> | undefined
  private _data: LoadingState<V, E>;
  private cancelled = false

  constructor (private config: LoadingConfig<V, E>) {
    this._data = { state: 'PENDING', settled: false }
  }

  private async startLoading () {
    const state = this._data

    assert(state.state === 'LOADING', 'Cannot call startLoading unless the value is LOADING')
    try {
      withinLoadingAction = true
      const actionVal = this.config.action()

      this._loading = actionVal

      withinLoadingAction = false

      const value = await this._loading

      if (this.cancelled || state.cancelled) {
        return value
      }

      this._data = {
        settled: true,
        state: 'LOADED',
        value,
      }

      this.config.onUpdate(this._data)

      return value
    } catch (e: unknown?) {
      const errorPayload = {
        settled: true,
        state: 'ERRORED',
        error: e,
      } as IsErrored<E>

      if (this.cancelled || state.cancelled) {
        return Promise.resolve(undefined)
      }

      this._data = errorPayload

      this.config.onUpdate(this._data)

      this.config.onError?.(e)

      return Promise.resolve(e)
    } finally {
      this._loading = undefined
      withinLoadingAction = false
    }
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
   * If we set to "false", it will
   * @param asPromise
   * @returns
   */
  load (): Promise<Immutable<V> | undefined> {
    if (this._data.state === 'PENDING') {
      const promise = Promise.resolve().then(() => this.startLoading())

      this._data = {
        settled: false,
        state: 'LOADING',
        promise,
        cancelled: false,
      }
    }

    if (this._data.state === 'LOADED') {
      return Promise.resolve(this._data.value)
    }

    if (this._data.state === 'ERRORED') {
      return Promise.resolve(undefined)
    }

    if (this._data.state === 'LOADING') {
      return this._data.promise.then((val) => val.value)
    }

    throw new Error(`Unexpected state`)
  }

  getState () {
    return this._data
  }

  cancel () {
    this.cancelled = true
  }

  reset () {
    this.cancel()

    return new LoadingContainer(this.config)
  }
}

export function makeLoadingContainer <V, E = any> (config: LoadingConfig<V, E>) {
  return new LoadingContainer(config)
}
