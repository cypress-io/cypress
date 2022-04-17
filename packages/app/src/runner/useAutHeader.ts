import { useElementSize } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useAutStore } from '../store'

const autStore = useAutStore()

export function useAutHeader () {
  const autHeaderEl = ref<HTMLDivElement>()
  const { height } = useElementSize(autHeaderEl)

  watch(height, () => {
    autStore.setSpecRunnerHeaderHeight(height.value)
  })

  return {
    autHeaderEl,
  }
}
