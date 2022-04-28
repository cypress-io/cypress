import { ref } from 'vue'

export function useAutHeader () {
  const autHeaderEl = ref<HTMLDivElement>()

  return {
    autHeaderEl,
  }
}
