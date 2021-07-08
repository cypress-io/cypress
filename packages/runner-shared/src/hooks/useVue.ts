import React, { useEffect } from 'react'
import { createApp } from 'vue'

/**
 * Mount a Vue component within React hierarchy.
 * Example:
 *
 * const MyVueComp = Vue.defineComponent({ ... })
 * const mountRef = React.useRef<HTMLDivElement>(null)
 *
 * useVue(mountRef, MyVueComp)
 *
 * // somewhere in the React hierarchy
 * <VueApp mountRef={mountRef} />
 */
export function useVue<T extends Element> (
  ref: React.MutableRefObject<T>,
  vueComponent: any,
) {
  useEffect(() => {
    if (ref.current) {
      createApp(vueComponent).mount(ref.current)
    }
  }, [ref, vueComponent])
}

export class VueApp extends React.PureComponent<{ mountRef: React.Ref<HTMLDivElement> }> {
  render () {
    return React.createElement('div', { ref: this.props.mountRef })
  }
}
