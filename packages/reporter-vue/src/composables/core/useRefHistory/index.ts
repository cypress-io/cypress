import { Fn, pausableFilter, ignorableWatch } from '../../shared'
import { useManualRefHistory, UseRefHistoryRecord, CloneFn } from '../useManualRefHistory'
import { Ref } from 'vue'

export interface UseRefHistoryOptions<Raw, Serialized = Raw> {
  /**
   * Watch for deep changes, default to false
   *
   * When set to true, it will also create clones for values store in the history
   *
   * @default false
   */
  deep?: boolean

  /**
   * The flush option allows for greater control over the timing of a history point, default to 'pre'
   *
   * Possible values: 'pre', 'post', 'sync'
   * It works in the same way as the flush option in watch and watch effect in vue reactivity
   *
   * @default 'pre'
   */
  flush?: 'pre' | 'post' | 'sync'

  /**
   * Maximum number of history to be kept. Default to unlimited.
   */
  capacity?: number

  /**
   * Clone when taking a snapshot, shortcut for dump: JSON.parse(JSON.stringify(value)).
   * Default to false
   *
   * @default false
   */
  clone?: boolean | CloneFn<Raw>
  /**
   * Serialize data into the history
   */
  dump?: (v: Raw) => Serialized
  /**
   * Deserialize data from the history
   */
  parse?: (v: Serialized) => Raw
}

export interface UseRefHistoryReturn<Raw, Serialized> {
  /**
   * Bypassed tracking ref from the argument
   */
  source: Ref<Raw>

  /**
   * An array of history records for undo, newest comes to first
   */
  history: Ref<UseRefHistoryRecord<Serialized>[]>

  /**
  * Last history point, source can be different if paused
  */
  last: Ref<UseRefHistoryRecord<Serialized>>

  /**
   * Same as 'history'
   */
  undoStack: Ref<UseRefHistoryRecord<Serialized>[]>

  /**
   * Records array for redo
   */
  redoStack: Ref<UseRefHistoryRecord<Serialized>[]>

  /**
   * A ref representing if the tracking is enabled
   */
  isTracking: Ref<boolean>

  /**
   * A ref representing if undo is possible (non empty undoStack)
   */
  canUndo: Ref<boolean>

  /**
   * A ref representing if redo is possible (non empty redoStack)
   */
  canRedo: Ref<boolean>

  /**
   * Undo changes
   */
  undo(): void

  /**
   * Redo changes
   */
  redo(): void

  /**
   * Clear all the history
   */
  clear(): void

  /**
   * Pause change tracking
   */
  pause(): void

  /**
   * Resume change tracking
   *
   * @param [commit] if true, a history record will be create after resuming
   */
  resume(commit?: boolean): void

  /**
   * Create new a new history record
   */
  commit(): void

  /**
   * Reset ref's value with lastest history
   */
  reset(): void

  /**
   * A sugar for auto pause and auto resuming within a function scope
   *
   * @param fn
   */
  batch(fn: (cancel: Fn) => void): void

  /**
   * Clear the data and stop the watch
   */
  dispose(): void
}

/**
 * Track the change history of a ref, also provides undo and redo functionality.
 *
 * @see https://vueuse.org/useRefHistory
 * @param source
 * @param options
 */
export function useRefHistory<Raw, Serialized = Raw>(
  source: Ref<Raw>,
  options: UseRefHistoryOptions<Raw, Serialized> = {},
): UseRefHistoryReturn<Raw, Serialized> {
  const {
    deep = false,
    flush = 'pre',
  } = options

  const { eventFilter, pause, resume: resumeTracking, isActive: isTracking } = pausableFilter()
  const { ignoreUpdates, ignorePrevAsyncUpdates, stop } = ignorableWatch(
    source,
    commit,
    { deep, flush, eventFilter },
  )

  function setSource(source: Ref<Raw>, value: Raw) {
    // Support changes that are done after the last history operation
    // examples:
    //   undo, modify
    //   undo, undo, modify
    // If there were already changes in the state, they will be ignored
    // examples:
    //   modify, undo
    //   undo, modify, undo
    ignorePrevAsyncUpdates()

    ignoreUpdates(() => {
      source.value = value
    })
  }

  const manualHistory = useManualRefHistory(source, { ...options, clone: options.clone || deep, setSource })

  const { clear, commit: manualCommit } = manualHistory

  function commit() {
    // This guard only applies for flush 'pre' and 'post'
    // If the user triggers a commit manually, then reset the watcher
    // so we do not trigger an extra commit in the async watcher
    ignorePrevAsyncUpdates()

    manualCommit()
  }

  function resume(commitNow?: boolean) {
    resumeTracking()
    if (commitNow)
      commit()
  }

  function batch(fn: (cancel: Fn) => void) {
    let canceled = false

    const cancel = () => canceled = true

    ignoreUpdates(() => {
      fn(cancel)
    })

    if (!canceled)
      commit()
  }

  function dispose() {
    stop()
    clear()
  }

  return {
    ...manualHistory,
    isTracking,
    pause,
    resume,
    commit,
    batch,
    dispose,
  }
}
