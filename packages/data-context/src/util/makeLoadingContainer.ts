export type IsPending = {
  state: 'PENDING'
  start: () => void
}

export type IsLoading = {
  state: 'LOADING'
  cancel: () => void
}

export type IsLoaded<V> = {
  state: 'LOADED'
  value: V
}

export type IsErrored<E> = {
  state: 'ERRORED'
  error: E
}

export type LoadingState<V, E = Error> = IsPending | IsLoading | IsLoaded<V> | IsErrored<E>

export interface LoadingConfig<V, E> {
  /**
   * The action to take to update the value
   */
  action: () => Promise<V>
  /**
   * When we update the value
   */
  updateValue: (val: IsLoaded<V> | IsErrored<E>) => any
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
 * A "Loading Container" is a concept which helps us model the asynchronous update
 * of a value
 */
export class LoadingContainer<V, E> {
  private state: LoadingState<V, E>;
  private cancelled = false

  constructor (private config: LoadingConfig<V, E>) {
    this.state = {
      state: 'LOADING',
      cancel: () => {
        this.cancel()
      },
    }

    this.startLoading()
  }

  private async startLoading () {
    try {
      const value = await this.config.action()

      if (this.cancelled) {
        return
      }

      this.state = {
        state: 'LOADED',
        value,
      }

      this.config.updateValue(this.state)
    } catch (e: unknown?) {
      if (this.cancelled) {
        return
      }

      this.state = {
        state: 'ERRORED',
        error: e,
      }

      this.config.updateValue(this.state)

      this.config.onError?.(e)
    }
  }

  getState () {
    return this.state
  }

  cancel () {
    this.cancelled = true
    this.config.onCancel?.()
  }
}

export function makeLoadingContainer <V, E> (config: LoadingConfig<V, E>): LoadingState<V, E> {
  return new LoadingContainer(config).getState()
}
