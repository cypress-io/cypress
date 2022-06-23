import type { DirectiveBinding } from 'vue'

/**
 * Runs the binding when clicking outside of the targetted component
 */
export const ClickOutside = {
  beforeMount (el: any, binding: DirectiveBinding<any>) {
    // Define ourClickEventHandler
    const ourClickEventHandler = (event: MouseEvent) => {
      if (!el.contains(event.target) && el !== event.target) {
        // as we are attaching an click event listern to the document (below)
        // ensure the events target is outside the element or a child of it
        binding.value(event) // before binding it
      }
    }

    // attached the handler to the element so we can remove it later easily
    el.__vueClickEventHandler__ = ourClickEventHandler

    // attaching ourClickEventHandler to a listener on the document here
    document.addEventListener('click', ourClickEventHandler)
  },
  unmounted (el: any) {
    // Remove Event Listener
    document.removeEventListener('click', el.__vueClickEventHandler__)
  },
}
