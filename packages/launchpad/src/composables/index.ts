import { computed } from 'vue'

/**
 * This snippet comes from Thorsten Lünborg and is explained in this blog post https://www.vuemastery.com/blog/vue-3-data-down-events-up/
 * @example const localValue = useModelWrapper(props, emit, 'modelValue')
 */
export function useModelWrapper<T, P = unknown> (
  props: T,
  emit: (evt: string, value: P) => void,
  name = 'modelValue',
) {
  return computed({
    get: () => props[name],
    set: (value) => emit(`update:${name}`, value),
  })
}
