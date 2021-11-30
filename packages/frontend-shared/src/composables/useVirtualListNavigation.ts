import { onBeforeUpdate, onUpdated, ref } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import type { UseVirtualListApi } from './useVirtualList'

export function useVirtualListNavigation ({
  containerRef,
  getOffset,
  getViewCapacity,
  source,
  scrollTo,
}: UseVirtualListApi) {
  const activeItem = ref<number | null>()
  const itemRefs = ref<{[key: number]: any}>({})
  const setItemRef = (el, index: number) => {
    if (el) {
      itemRefs.value[index] = el
    }
  }

  onBeforeUpdate(() => {
    itemRefs.value = {}
  })

  onUpdated(() => {
    if (activeItem.value != null) {
      itemRefs.value[activeItem.value].focus({ preventScroll: true })
    }
  })

  onKeyStroke('ArrowDown', (event: KeyboardEvent) => {
    event.preventDefault()
    const element = containerRef.value

    if (element) {
      activeItem.value = activeItem.value ?? 0
      if ((activeItem.value + 1) === source.value.length) {
        activeItem.value = 0
        scrollTo(activeItem.value)

        return
      }

      activeItem.value++

      const offset = getOffset(element.scrollTop)
      const viewCapacity = getViewCapacity(element.clientHeight)

      const fromIdx = offset - 1
      const toIdx = fromIdx + (viewCapacity - 1)

      if (activeItem.value >= toIdx) {
        scrollTo(fromIdx + 1)
      } else {
        itemRefs.value[activeItem.value].focus({ preventScroll: true })
      }
    }
  }, { target: containerRef })

  onKeyStroke('ArrowUp', (event) => {
    event.preventDefault()
    const element = containerRef.value

    if (element) {
      activeItem.value = activeItem.value ?? 0
      if (activeItem.value === 0) {
        activeItem.value = source.value.length - 1
        scrollTo(activeItem.value)

        return
      }

      activeItem.value--

      const offset = getOffset(element.scrollTop)

      const fromIndex = offset - 1

      if (activeItem.value < fromIndex) {
        scrollTo(fromIndex - 1)
      } else {
        itemRefs.value[activeItem.value].focus({ preventScroll: true })
      }
    }
  }, { target: containerRef })

  return {
    activeItem,
    rowProps: {
      tabindex: '-1',
    },
    setItemRef,
  }
}
