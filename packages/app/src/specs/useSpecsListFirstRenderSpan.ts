import { onBeforeUnmount, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import { telemetry } from '@packages/telemetry/browser/client'

let hasStarted = false

/**
 * Times the first render of the specs list in this page load. The virtual list
 * only renders rows once it has measured its container, so the span ends with
 * the first render that shows a row, at mount when there are no specs to show,
 * or at unmount if neither happened.
 */
export function useSpecsListFirstRenderSpan ({ specCount, renderedRowCount }: { specCount: Ref<number>, renderedRowCount: Ref<number> }) {
  if (hasStarted) {
    return
  }

  hasStarted = true

  const span = telemetry.startSpan({ name: 'specs:list:first:render', parentSpan: telemetry.getSpan('cypress:app') })

  if (!span) {
    return
  }

  let ended = false

  const end = () => {
    if (ended) {
      return
    }

    ended = true
    stopWatchingRows()

    span.setAttributes({
      specCount: specCount.value,
      renderedRowCount: renderedRowCount.value,
      timeSinceNavigationStartMs: Math.round(performance.now()),
    })

    span.end()
  }

  const stopWatchingRows = watch(renderedRowCount, (count) => {
    if (count > 0) {
      end()
    }
  }, { flush: 'post' })

  onMounted(() => {
    if (specCount.value === 0) {
      end()
    }
  })

  // Leaving before the first row renders would otherwise drop the span, hiding the slowest loads
  onBeforeUnmount(() => {
    if (!ended) {
      span.setAttribute('endedBeforeFirstRow', true)
      end()
    }
  })
}
