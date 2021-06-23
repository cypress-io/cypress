import { watch, WatchSource, WatchOptions, WatchStopHandle, WatchCallback } from 'vue'
import { bypassFilter, ConfigurableEventFilter, createFilterWrapper, MapOldSources, MapSources } from '../utils'

export interface WatchWithFilterOptions<Immediate> extends WatchOptions<Immediate>, ConfigurableEventFilter {}

// overlads
export function watchWithFilter<T extends Readonly<WatchSource<unknown>[]>, Immediate extends Readonly<boolean> = false>(sources: T, cb: WatchCallback<MapSources<T>, MapOldSources<T, Immediate>>, options?: WatchWithFilterOptions<Immediate>): WatchStopHandle
export function watchWithFilter<T, Immediate extends Readonly<boolean> = false>(source: WatchSource<T>, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchWithFilterOptions<Immediate>): WatchStopHandle
export function watchWithFilter<T extends object, Immediate extends Readonly<boolean> = false>(source: T, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchWithFilterOptions<Immediate>): WatchStopHandle

// implementation
export function watchWithFilter<Immediate extends Readonly<boolean> = false>(
  source: any,
  cb: any,
  options: WatchWithFilterOptions<Immediate> = {},
): WatchStopHandle {
  const {
    eventFilter = bypassFilter,
    ...watchOptions
  } = options

  return watch(
    source,
    createFilterWrapper(
      eventFilter,
      cb,
    ),
    watchOptions,
  )
}
