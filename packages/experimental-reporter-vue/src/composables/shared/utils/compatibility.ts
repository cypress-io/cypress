import { isVue3 } from 'vue'

export function __onlyVue3(name = 'this function') {
  if (isVue3)
    return

  throw new Error(`[VueUse] ${name} is only works on Vue 3.`)
}
