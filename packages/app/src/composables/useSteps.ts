import type { MaybeRef } from '@vueuse/core'
import { computed, ref, unref } from 'vue'

export const useSteps = (steps: Record<any, any>[]) => {
  const idx = ref(0)
  const isFirst = computed(() => idx.value === 0)
  const isLast = computed(() => idx.value === steps.length - 1)
  const step = computed(() => unref(steps)[idx.value])

  const back = () => {
    if (idx.value !== 0) {
      idx.value--
    }
  }

  const next = () => {
    if (idx.value < unref(steps).length - 1) {
      idx.value++
    }
  }

  const go = (newIdx: MaybeRef<number>) => {
    if (unref(steps)[unref(newIdx)]) {
      idx.value = unref(newIdx)
    }
  }

  const restart = () => {
    idx.value = 0
  }

  return {
    step,
    idx,
    back,
    next,
    isFirst,
    isLast,
    restart,
    go
  }
}