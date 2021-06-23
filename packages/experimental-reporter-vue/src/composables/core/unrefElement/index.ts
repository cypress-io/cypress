import { defineComponent, unref } from 'vue'
import { MaybeRef } from '../../shared'

export type VueInstance = InstanceType<ReturnType<typeof defineComponent>>
export type MaybeElementRef = MaybeRef<Element | VueInstance | undefined | null>

/**
 * Get the dom element of a ref of element or Vue component instance
 *
 * @param elRef
 */
export function unrefElement(elRef: MaybeElementRef) {
  const plain = unref(elRef) as VueInstance
  if (plain && plain.$el) {
      return plain
  }
  return null
}
