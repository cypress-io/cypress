import { timestamp } from '../utils'
import { watch, ref, WatchSource, WatchOptions, Ref } from 'vue'

export interface UseLastChangedOptions<
  Immediate extends boolean,
  InitialValue extends number | null | undefined = undefined
> extends WatchOptions<Immediate> {
  initialValue?: InitialValue
}

/**
 * Records the timestamp of the last change
 *
 * @see https://vueuse.org/useLastChanged
 */
export function useLastChanged(source: WatchSource, options?: UseLastChangedOptions<false>): Ref<number | null>
export function useLastChanged(source: WatchSource, options: UseLastChangedOptions<true>): Ref<number>
export function useLastChanged(source: WatchSource, options: UseLastChangedOptions<boolean, number>): Ref<number>
export function useLastChanged(source: WatchSource, options: UseLastChangedOptions<boolean, any> = {}): Ref<number | null> | Ref<number> {
  let initialV: any = null
  if (options.initialValue) {
    initialV = options.initialValue
  }
  const ms = ref<number | null>(initialV)

  watch(
    source,
    () => ms.value = timestamp(),
    options,
  )

  return ms
}
