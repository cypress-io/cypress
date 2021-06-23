import { computed, ref, watch } from 'vue'
import { ConfigurableWindow, defaultWindow } from '../_configurable'
import { MaybeElementRef, unrefElement } from '../unrefElement'

/**
 * Manipulate CSS variables.
 *
 * @see https://vueuse.org/useCssVar
 * @param prop
 * @param el
 * @param options
 */
export function useCssVar(
  prop: string,
  target?: MaybeElementRef,
  { window = defaultWindow }: ConfigurableWindow = {},
) {
  const variable = ref('')
  const elRef = computed(() => unrefElement(target) || window && window.document && window.document.documentElement)

  watch(
    elRef,
    (el) => {
      if (el && window)
        variable.value = window.getComputedStyle(el).getPropertyValue(prop)
    },
    { immediate: true },
  )

  watch(
    variable,
    (val) => {
      if (elRef.value && elRef.value.style)
        elRef.value.style.setProperty(prop, val)
    },
  )

  return variable
}
