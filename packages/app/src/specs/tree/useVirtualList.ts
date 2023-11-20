import type { Ref, CSSProperties } from 'vue'
import { watch, ref, computed, shallowRef } from 'vue'
import type { MaybeRef } from '@vueuse/core'
import { useElementSize } from '@vueuse/core'
import { isEqual } from 'lodash'

export type UseVirtualListApi = ReturnType<typeof useVirtualList>['api']

export interface UseVirtualListOptions {
  /**
   * item height, accept a pixel value or a function that returns the height
   *
   * @default 0
   */
  itemHeight: number | ((index: number) => number)
  /**
   * the extra buffer items outside of the view area
   *
   * @default 5
   */
  overscan?: number
}

export type UseVirtualListItem<T> = {
  data: T
  index: number
}

export function useVirtualList<T = any> (list: MaybeRef<T[]>, options: UseVirtualListOptions) {
  const containerRef: Ref = ref<HTMLElement | null>()

  const size = useElementSize(containerRef)

  const currentList: Ref<UseVirtualListItem<T>[]> = ref([])
  const source = shallowRef(list)

  const state: Ref = ref({ start: 0, end: 10 })
  const { itemHeight, overscan = 5 } = options

  const getViewCapacity = (containerHeight: number) => {
    if (typeof itemHeight === 'number') {
      return Math.ceil(containerHeight / itemHeight)
    }

    const { start = 0 } = state.value
    let sum = 0
    let capacity = 0

    for (let i = start; i < source.value.length; i++) {
      const height = (itemHeight as (index: number) => number)(i)

      sum += height
      if (sum >= containerHeight) {
        capacity = i
        break
      }
    }

    return capacity - start
  }

  const getOffset = (scrollTop: number) => {
    if (typeof itemHeight === 'number') {
      return Math.floor(scrollTop / itemHeight) + 1
    }

    let sum = 0
    let offset = 0

    for (let i = 0; i < source.value.length; i++) {
      const height = (itemHeight as (index: number) => number)(i)

      sum += height
      if (sum >= scrollTop) {
        offset = i
        break
      }
    }

    return offset + 1
  }

  const calculateRange = () => {
    const element = containerRef.value

    if (element) {
      const offset = getOffset(element.scrollTop)
      const viewCapacity = getViewCapacity(element.clientHeight)

      const from = offset - overscan
      const to = offset + viewCapacity + overscan

      state.value = {
        start: from < 0 ? 0 : from,
        end: to > source.value.length
          ? source.value.length
          : to,
      }

      currentList.value = source.value
      .slice(state.value.start, state.value.end)
      .map((ele, index) => {
        return {
          data: ele,
          index: index + state.value.start,
        }
      })
    }
  }

  watch([size.height, list], (newVal, oldVal) => {
    if (!isEqual(newVal, oldVal)) {
      calculateRange()
    }
  })

  const totalHeight = computed(() => {
    if (typeof itemHeight === 'number') {
      return source.value.length * itemHeight
    }

    return source.value.reduce((sum, _, index) => sum + itemHeight(index), 0)
  })

  const getDistanceTop = (index: number) => {
    if (typeof itemHeight === 'number') {
      const height = index * itemHeight

      return height
    }

    const height = source.value
    .slice(0, index)
    .reduce((sum, _, i) => sum + itemHeight(i), 0)

    return height
  }

  const scrollTo = (index: number) => {
    if (containerRef.value) {
      containerRef.value.scrollTop = getDistanceTop(index)
      calculateRange()
    }
  }

  const offsetTop = computed(() => getDistanceTop(state.value.start))
  const wrapperProps = computed(() => {
    return {
      style: {
        width: '100%',
        height: `${totalHeight.value - offsetTop.value}px`,
        marginTop: `${offsetTop.value}px`,
      },
    }
  })

  const containerStyle: CSSProperties = { overflowY: 'auto' }

  return {
    list: currentList,
    scrollTo,
    containerProps: {
      ref: containerRef,
      onScroll: () => {
        calculateRange()
      },
      style: containerStyle,
    },
    wrapperProps,
    api: {
      containerRef,
      getOffset,
      getViewCapacity,
      source,
      scrollTo,
    },
  }
}
