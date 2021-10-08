import { computed } from 'vue'
import { useI18n as _useI18n } from 'vue-i18n'
import type { MessageSchema } from '@packages/frontend-shared/src/locales/schema'

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

export function useI18n () {
  return _useI18n<{ message: MessageSchema }>({ useScope: 'global' })
}
