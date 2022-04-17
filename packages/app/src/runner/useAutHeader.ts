import { useElementSize } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useAutStore } from '../store'

export function useAutHeader () {
  const autStore = useAutStore()
  const autHeaderEl = ref<HTMLDivElement>()
  const { height } = useElementSize(autHeaderEl)

  watch(height, () => {
    autStore.setSpecRunnerHeaderHeight(height.value)
  })

  return {
    autHeaderEl,
  }
}
