import { computed } from 'vue'

/**
 * This snippet comes from Thorsten Lünborg and is explained in this blog post https://www.vuemastery.com/blog/vue-3-data-down-events-up/
 * @example const localValue = useModelWrapper(props, emit, 'modelValue')
 */
export function useModelWrapper<T, N extends string = 'modelValue'> (
  props: T,
  emit: (event: N, ...args: any[]) => void,
  name = 'modelValue',
) {
  return computed({
    get: () => props[name],
    set: (value: any) => {
      emit(`update:${name}` as any, value)
    },
  })
}
