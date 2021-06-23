import { isRef, Ref, ref } from 'vue'

/**
 * A boolean ref with a toggler
 *
 * @see https://vueuse.org/useToggle
 * @param [initialValue=false]
 */
export function useToggle(value: Ref<boolean>): () => boolean
export function useToggle(initialValue?: boolean): [Ref<boolean>, () => boolean]

export function useToggle(initialValue: boolean | Ref<boolean> = false) {
  if (isRef(initialValue)) {
    return () => (initialValue.value = !initialValue.value)
  }
  else {
    const boolean = ref(initialValue)
    const toggle = () => (boolean.value = !boolean.value)

    return [boolean, toggle] as const
  }
}
