import { onKeyStroke } from '@vueuse/core'
import { computed, watch } from 'vue'

export const useListNavigation = (rootEl) => {
  const focused = ref()

  const scroll = (el) => {
    if (typeof el.focus === 'function') {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ block: 'nearest' })
    }
  }

  const goToItem = (direction: 'next' | 'previous', event) => {
    event.preventDefault()

    const target = (event.target as HTMLAnchorElement)

    if (!target) return

    const firstEl = target.parentElement?.firstElementChild as HTMLAnchorElement
    const lastEl = target.parentElement?.lastElementChild as HTMLAnchorElement
    const el = (direction === 'next' ? target.nextElementSibling : target.previousElementSibling) as HTMLAnchorElement

    if (typeof el.focus === 'function') scroll(el)
    else if (direction === 'next') scroll(firstEl)
    else if (direction === 'previous') scroll(lastEl)
  }

  const children = computed(() => rootEl.value?.children || [])

  watch(children, () => {
    for (const child of children.value) {
      onKeyStroke('ArrowDown', (event: KeyboardEvent) => {
        goToItem('next', event)
      }, { target: child })

      onKeyStroke('ArrowUp', (event) => {
        goToItem('previous', event)
      }, { target: child })
    }
  })
}
