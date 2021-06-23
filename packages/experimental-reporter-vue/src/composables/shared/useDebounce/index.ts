import { ref, Ref, watch } from 'vue'
import { useDebounceFn } from '../useDebounceFn'

export function useDebounce<T>(value: Ref<T>, ms = 200): Readonly<Ref<T>> {
  if (ms <= 0)
    return value

  const debounced = ref(value.value as T) as Ref<T>

  const updater = useDebounceFn(() => {
    debounced.value = value.value
  }, ms)

  watch(value, () => updater())

  return debounced
}
