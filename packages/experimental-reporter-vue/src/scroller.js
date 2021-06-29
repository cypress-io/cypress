import { ref } from 'vue'
import { useRafFn, whenever } from './composables/core'

export function useScroller(container) {
  const pause = ref(null)
  const resume = ref(null)

  whenever(container, (v) => {    
    const playPause = useRafFn(() => {
      container.value.scrollIntoView({ block: 'end' })
    })

    pause.value = playPause.pause
    resume.value = playPause.resume
  })
  return { pause, resume }
}

