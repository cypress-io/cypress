import { onKeyStroke } from '@vueuse/core'
import { computed, watch, ref, Ref } from 'vue'
import type { UseCollapsibleTreeNode } from './useCollapsibleTree'

export const useListNavigation = (rootEl, itemRefs: Ref<any[]>) => {
  const selectedItem = ref(0)

  const scroll = (el) => {
    if (typeof el.focus === 'function') {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ block: 'nearest' })
    }
  }

  const goToItem = (direction: 'next' | 'previous', event) => {
    event.preventDefault()
    if (direction === 'next') {
      if (selectedItem.value + 1 >= itemRefs.value.length) {
        selectedItem.value = 0
      } else {
        selectedItem.value++
      }
    } else {
      if (selectedItem.value <= 0) {
        selectedItem.value = itemRefs.value.length - 1
      } else {
        selectedItem.value--
      }
    }
    itemRefs.value[selectedItem.value]?.focus({ preventScroll: true })
    itemRefs.value[selectedItem.value]?.scrollIntoView({ block: 'nearest' })


    // const target = (event.target as HTMLAnchorElement)

    // if (!target) return

    // const firstEl = target.parentElement?.firstElementChild as HTMLAnchorElement
    // const lastEl = target.parentElement?.lastElementChild as HTMLAnchorElement
    // const el = (direction === 'next' ? target.nextElementSibling : target.previousElementSibling) as HTMLAnchorElement

    // if (typeof el.focus === 'function') scroll(el)
    // else if (direction === 'next') scroll(firstEl)
    // else if (direction === 'previous') scroll(lastEl)
  }


  onKeyStroke('ArrowDown', (event: KeyboardEvent) => {
    goToItem('next', event)
  }, { target: rootEl })

  onKeyStroke('ArrowUp', (event) => {
    goToItem('previous', event)
  }, { target: rootEl })

  return {selectedItem}
}
