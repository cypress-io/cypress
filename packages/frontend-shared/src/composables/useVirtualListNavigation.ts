import { onBeforeUpdate, onUpdated, ref, unref } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import type { UseVirtualListApi } from './useVirtualList'

const focusEl = (itemRefs, activeItem) => {
  const idx = unref(activeItem)
  const el = itemRefs.value[idx]?.$el ?? itemRefs.value[idx]

  if (typeof el?.focus === 'function') {
    el.focus({ preventScroll: true })
  }
}

export function useVirtualListNavigation ({
  containerRef,
  getOffset,
  getViewCapacity,
  source,
  scrollTo,
}: UseVirtualListApi) {
  const activeItem = ref<number | null>(null)
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
    focusEl(itemRefs, activeItem)
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
        focusEl(itemRefs, activeItem)
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
        focusEl(itemRefs, activeItem)
      }
    }
  }, { target: containerRef })

  return {
    activeItem,
    setItemRef,
  }
}
