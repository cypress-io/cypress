import { computed, getCurrentInstance, ref, watch } from 'vue'

const isVue2 = false

export interface VModelOptions {
  /**
   * When passive is set to `true`, it will use `watch` to sync with props and ref.
   * Instead of relying on the `v-model` or `.sync` to work.
   *
   * @default false
   */
  passive?: boolean
  /**
   * When eventName is set, it's value will be used to overwrite the emit event name.
   *
   * @default undefined
   */
  eventName?: string
}

/**
 * Shorthand for v-model binding, props + emit -> ref
 *
 * @see https://vueuse.org/useVModel
 * @param props
 * @param key (default 'value' in Vue 2 and 'modelValue' in Vue 3)
 * @param emit
 */
export function useVModel<P extends object, K extends keyof P, Name extends string>(
  props: P,
  key?: K,
  emit?: (name: Name, ...args: any[]) => void,
  options: VModelOptions = {},
) {
  const {
    passive = false,
    eventName,
  } = options

  const vm = getCurrentInstance()
  // @ts-expect-error mis-alignment with @vue/composition-api
  const _emit = emit || vm && vm.emit || vm.$emit && vm.$emit.bind(vm)
  let event: string | undefined = eventName

  if (!key) {
    if (isVue2) {
      const modelOptions = vm && vm.proxy && vm.proxy.$options && vm.proxy.$options.model
      key = modelOptions && modelOptions.value || 'value' as K
      if (!eventName) event = modelOptions && modelOptions.event || 'input'
    }
    else {
      key = 'modelValue' as K
    }
  }

  event = eventName || event || `update:${key}`

  if (passive) {
    const proxy = ref<P[K]>(props[key!])

    watch(() => props[key!], v => proxy.value = v as any)
    watch(proxy, (v) => {
      if (v !== props[key!])
        _emit(event, v)
    })

    return proxy
  }
  else {
    return computed<P[K]>({
      get() {
        return props[key!]
      },
      set(value) {
        _emit(event, value)
      },
    })
  }
}
