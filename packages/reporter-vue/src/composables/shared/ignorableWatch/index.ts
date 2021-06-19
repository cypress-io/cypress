import { ref, watch, WatchSource, WatchStopHandle, WatchCallback } from 'vue'
import { Fn, createFilterWrapper, bypassFilter, MapSources, MapOldSources } from '../utils'
import { WatchWithFilterOptions } from '../watchWithFilter'

// ignorableWatch(source,callback,options) composable
//
// Extended watch that exposes a ignoreUpdates(updater) function that allows to update the source without triggering effects

export type IgnoredUpdater = (updater: () => void) => void

export interface IgnorableWatchReturn {
  ignoreUpdates: IgnoredUpdater
  ignorePrevAsyncUpdates: () => void
  stop: WatchStopHandle
}

export function ignorableWatch<T extends Readonly<WatchSource<unknown>[]>, Immediate extends Readonly<boolean> = false>(sources: T, cb: WatchCallback<MapSources<T>, MapOldSources<T, Immediate>>, options?: WatchWithFilterOptions<Immediate>): IgnorableWatchReturn
export function ignorableWatch<T, Immediate extends Readonly<boolean> = false>(source: WatchSource<T>, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchWithFilterOptions<Immediate>): IgnorableWatchReturn
export function ignorableWatch<T extends object, Immediate extends Readonly<boolean> = false>(source: T, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchWithFilterOptions<Immediate>): IgnorableWatchReturn

export function ignorableWatch<Immediate extends Readonly<boolean> = false>(
  source: any,
  cb: any,
  options: WatchWithFilterOptions<Immediate> = {},
): IgnorableWatchReturn {
  const {
    eventFilter = bypassFilter,
    ...watchOptions
  } = options

  const filteredCb = createFilterWrapper(
    eventFilter,
    cb,
  )

  let ignoreUpdates: IgnoredUpdater
  let ignorePrevAsyncUpdates: () => void
  let stop: () => void

  if (watchOptions.flush === 'sync') {
    const ignore = ref(false)

    // no op for flush: sync
    ignorePrevAsyncUpdates = () => {}

    ignoreUpdates = (updater: () => void) => {
      // Call the updater function and count how many sync updates are performed,
      // then add them to the ignore count
      ignore.value = true
      updater()
      ignore.value = false
    }

    stop = watch(
      source,
      (...args) => {
        if (!ignore.value)
          filteredCb(...args)
      },
      watchOptions,
    )
  }
  else {
    // flush 'pre' and 'post'

    const disposables: Fn[] = []

    // counters for how many following changes to be ignored
    // ignoreCounter is incremented before there is a history operation
    // affecting the source ref value (undo, redo, revert).
    // syncCounter is incremented in sync with every change to the
    // source ref value. This let us know how many times the ref
    // was modified and support chained sync operations. If there
    // are more sync triggers than the ignore count, the we now
    // there are modifications in the source ref value that we
    // need to commit
    const ignoreCounter = ref(0)
    const syncCounter = ref(0)

    ignorePrevAsyncUpdates = () => {
      ignoreCounter.value = syncCounter.value
    }

    // Sync watch to count modifications to the source
    disposables.push(
      watch(
        source,
        () => {
          syncCounter.value++
        },
        { ...watchOptions, flush: 'sync' },
      ),
    )

    ignoreUpdates = (updater: () => void) => {
      // Call the updater function and count how many sync updates are performed,
      // then add them to the ignore count
      const syncCounterPrev = syncCounter.value
      updater()
      ignoreCounter.value += syncCounter.value - syncCounterPrev
    }

    disposables.push(
      watch(
        source,
        (...args) => {
          // If a history operation was performed (ignoreCounter > 0) and there are
          // no other changes to the source ref value afterwards, then ignore this commit
          const ignore = ignoreCounter.value > 0 && ignoreCounter.value === syncCounter.value
          ignoreCounter.value = 0
          syncCounter.value = 0
          if (ignore)
            return

          filteredCb(...args)
        },
        watchOptions,
      ),
    )

    stop = () => {
      disposables.forEach(fn => fn())
    }
  }

  return { stop, ignoreUpdates, ignorePrevAsyncUpdates }
}
