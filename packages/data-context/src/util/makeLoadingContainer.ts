export type IsPending = {
  settled: false
  state: 'PENDING'
  error?: never
}

export type IsLoading<V> = {
  settled: false
  state: 'LOADING'
  promise: Promise<V>
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
  error: E
}

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
   */
  name: string
  /**
   * The action to take to update the value
   */
  action: () => Promise<V>
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
}

/**
 * A "Loading Container" is a concepts which helps us model the asynchronous update
 * of a value, with the ability to re-execute, cancel in flight for the purpose of
 * test teardown.
 *
 * In our application we have a few of these: "project config",
 */
export class LoadingContainer<V, E = any> {
  private _inFlight = { cancelled: false }
  /**
   * Caches the "loading" value on the class, so we can
   */
  private _loading: Promise<V> | undefined
  private _data: LoadingState<V, E>;
  private cancelled = false

  constructor (private config: LoadingConfig<V, E>) {
    this._data = { state: 'PENDING', settled: false }
  }

  load () {
    if (this._data.state === 'PENDING') {
      this._data = {
        settled: false,
        state: 'LOADING',
        promise: this.startLoading(),
      }

      return this
    }

    return this
  }

  private async startLoading () {
    try {
      withinLoadingAction = true
      const actionVal = this.config.action()

      this._loading = actionVal

      withinLoadingAction = false

      const value = await this._loading

      if (this.cancelled) {
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
      if (this.cancelled) {
        return Promise.reject(e)
      }

      this._data = {
        settled: true,
        state: 'ERRORED',
        error: e,
      }

      this.config.onUpdate(this._data)

      this.config.onError?.(e)

      return Promise.reject(e)
    } finally {
      this._loading = undefined
      withinLoadingAction = false
    }
  }

  reload (force = false) {
    if (this._data.state === 'LOADING' && !force) {
      return this
    }

    this._inFlight.cancelled = true
    this._inFlight = { cancelled: false }
    this._data = { state: 'PENDING', settled: false }
    this.startLoading()

    return this
  }

  toPromise (): Promise<V> {
    if (this._data.state === 'LOADED') {
      return Promise.resolve(this._data.value)
    }

    if (this._data.state === 'ERRORED') {
      return Promise.reject(this._data.error)
    }

    if (this._data.state === 'LOADING') {
      return this._data.promise
    }

    this.load()

    return this.toPromise()
  }

  getState () {
    return this._data
  }

  cancel () {
    this._inFlight.cancelled = true
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
