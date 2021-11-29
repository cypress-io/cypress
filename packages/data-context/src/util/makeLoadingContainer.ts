import type Observable from 'zen-observable'
import pDefer from 'p-defer'
import { isObservable } from '@packages/types'

export type IsPending = {
  state: 'PENDING'
}

export type IsLoading = {
  state: 'LOADING'
}

export type IsLoaded<V> = {
  state: 'LOADED'
  value: V
}

export type IsErrored<E> = {
  state: 'ERRORED'
  error: E
}

export type LoadingState<V, E = any> = IsPending | IsLoading | IsLoaded<V> | IsErrored<E>

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
   *
   */
  onCreate?: () => void
  /**
   * The action to take to update the value
   */
  action: () => Promise<V> | Observable<V>
  /**
   * When we update the value
   */
  onUpdate: (val: IsLoaded<V> | IsErrored<E>) => any
  /**
   * Called when we call "reload" on the
   */
  onReload?: () => {}
  /**
   * Optional callback after there's an error
   */
  onError?: (err: E) => void
  /**
   * Called when we "cancel" the loading state, cleans up
   * the created server, kills a PID, etc.
   */
  onCancel?: () => void
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
  private _loading: Promise<V> | ZenObservable.Subscription | undefined
  private _data: LoadingState<V, E>;
  private cancelled = false

  constructor (private config: LoadingConfig<V, E>) {
    this._data = { state: 'PENDING' }
    this.config.onCreate?.(this)
  }

  load () {
    if (this._data.state === 'PENDING') {
      this._data = { state: 'LOADING' }
      this.startLoading()

      return this
    }

    return this
  }

  private async startLoading () {
    try {
      withinLoadingAction = true
      const actionVal = this.config.action()

      if (isObservable(actionVal)) {
        this._loading = actionVal.subscribe({
          next () {},
          error () {},
          complete () {},
        })
      } else {
        this._loading = actionVal
      }

      withinLoadingAction = false

      const value = await actionVal

      if (this.cancelled) {
        return
      }

      this._data = {
        state: 'LOADED',
        value,
      }

      this.config.onUpdate(this._data)
    } catch (e: unknown?) {
      if (this.cancelled) {
        return
      }

      this._data = {
        state: 'ERRORED',
        error: e,
      }

      this.config.onUpdate(this._data)

      this.config.onError?.(e)
    } finally {
      this._loading = undefined
      withinLoadingAction = false
    }
  }

  reload (force = false) {
    if (this.cancelled) {
      throw new Error(`Cannot reload a cancelled loading container`)
    }

    if (this.cancelled || this._data.state === 'LOADING') {
      return this
    }

    return this
  }

  toPromise () {
    const dfd = pDefer<V>()

    return dfd.promise
  }

  getState () {
    return this._data
  }

  cancel () {
    this.cancelled = true
    this.config.onCancel?.()
  }

  reset () {
    this.cancel()

    return new LoadingContainer(this.config)
  }
}

export function makeLoadingContainer <V, E = any> (config: LoadingConfig<V, E>) {
  return new LoadingContainer(config)
}
