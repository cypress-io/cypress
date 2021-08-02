import { computed } from 'vue'

/**
 * This snippet comes from Thorsten Lünborg and is explained in this blog post https://www.vuemastery.com/blog/vue-3-data-down-events-up/
 * @example const localValue = useModelWrapper(props, emit, 'modelValue')
 * @param {string} [name='modelValue'] - The name of the model property to use. modelValue is the default.
 */
export function useModelWrapper(props, emit, name = 'modelValue') {
  return computed({ 
    get: () => props[name], 
    set: (value) => emit(`update:${name}`, value) 
  })
}
