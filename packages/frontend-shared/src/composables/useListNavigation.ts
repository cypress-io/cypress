import { onKeyStroke } from '@vueuse/core'
import { ref, onBeforeUpdate } from 'vue'

export const useListNavigation = (rootEl) => {
  const selectedItem = ref(0)
  const itemRefs = ref([]) as any
  const setItemRef = (el) => {
    if (el) {
      itemRefs.value.push(el)
    }
  }

  onBeforeUpdate(() => {
    itemRefs.value = []
  })

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
  }

  onKeyStroke('ArrowDown', (event: KeyboardEvent) => {
    goToItem('next', event)
  }, { target: rootEl })

  onKeyStroke('ArrowUp', (event) => {
    goToItem('previous', event)
  }, { target: rootEl })

  return {
    selectedItem,
    rowProps: {
      ref: setItemRef,
      tabindex: '-1',
    },
  }
}
