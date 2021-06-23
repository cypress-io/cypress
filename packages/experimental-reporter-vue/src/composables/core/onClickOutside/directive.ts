import { FunctionDirective } from 'vue'
import { onClickOutside, OnClickOutsideEvents } from '.'

/**
 * TODO: Test that this actually works
 */
export const VOnClickOutside: FunctionDirective<any, (evt: OnClickOutsideEvents['pointerdown']) => void> = (el, binding) => {
  onClickOutside(el, binding.value)
}
