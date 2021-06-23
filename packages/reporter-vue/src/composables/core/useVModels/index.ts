import { ToRefs } from 'vue'
import { useVModel, VModelOptions } from '../useVModel'

/**
 * Shorthand for props v-model binding. Think like `toRefs(props)` but changes will also emit out.
 *
 * @see https://vueuse.org/useVModels
 * @param props
 * @param emit
 */
export function useVModels<P extends object, Name extends string>(
  props: P,
  emit?: (name: Name, ...args: any[]) => void,
  options: VModelOptions = {},
): ToRefs<P> {
  const ret: any = {}
  // eslint-disable-next-line no-restricted-syntax
  for (const key in props)
    ret[key] = useVModel(props, key, emit, options)
  return ret
}
