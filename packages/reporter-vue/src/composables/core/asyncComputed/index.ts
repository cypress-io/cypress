import { Fn } from '../../shared'
import { ref, isRef, computed, watchEffect, Ref } from 'vue'

/**
 * Handle overlapping async evaluations.
 *
 * @param cancelCallback The provided callback is invoked when a re-evaluation of the computed value is triggered before the previous one finished
 */
export type AsyncComputedOnCancel = (cancelCallback: Fn) => void

/**
 * Additional options for asyncComputed
 *
 * @property lazy         Should value be evaluated lazily
 * @property evaluating   Ref passed to receive the updated of async evaluation
 */
export type AsyncComputedOptions = {
  lazy?: Boolean
  evaluating?: Ref<boolean>
}

/**
 * Create an asynchronous computed dependency.
 *
 * @see https://vueuse.org/asyncComputed
 * @param evaluationCallback     The promise-returning callback which generates the computed value
 * @param initialState           The initial state, used until the first evaluation finishes
 * @param optionsOrRef           Additional options or a ref passed to receive the updates of the async evaluation
 */
export function asyncComputed<T>(
  evaluationCallback: (onCancel: AsyncComputedOnCancel) => T | Promise<T>,
  initialState?: T,
  optionsOrRef?: Ref<boolean> | AsyncComputedOptions,
): Ref<T> {
  let options: AsyncComputedOptions

  if (isRef(optionsOrRef)) {
    options = {
      evaluating: optionsOrRef,
    }
  }
  else {
    options = optionsOrRef || {}
  }

  const {
    lazy = false,
    evaluating = undefined,
  } = options

  const started = ref(!lazy)
  const current = ref(initialState) as Ref<T>
  let counter = 0

  watchEffect(async(onInvalidate) => {
    if (!started.value)
      return

    counter++
    const counterAtBeginning = counter
    let hasFinished = false

    try {
      // Defer initial setting of `evaluating` ref
      // to avoid having it as a dependency
      if (evaluating) {
        Promise.resolve().then(() => {
          evaluating.value = true
        })
      }

      const result = await evaluationCallback((cancelCallback) => {
        onInvalidate(() => {
          if (evaluating)
            evaluating.value = false

          if (!hasFinished)
            cancelCallback()
        })
      })

      if (counterAtBeginning === counter)
        current.value = result
    }
    finally {
      if (evaluating)
        evaluating.value = false

      hasFinished = true
    }
  })

  if (lazy) {
    return computed(() => {
      started.value = true
      return current.value
    })
  }
  else {
    return current
  }
}
