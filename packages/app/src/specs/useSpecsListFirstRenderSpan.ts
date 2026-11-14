import { onBeforeUnmount, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import { telemetry } from '@packages/telemetry/browser/client'

let hasStarted = false

/**
 * Times the first render of the specs list in this page load. The virtual list
 * only renders rows once it has measured its container, so the span ends with
 * the first render that shows a row, or at mount when there are no specs to show.
 * Leaving before either still ends it, so the slowest loads are not dropped.
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

  onBeforeUnmount(() => {
    if (!ended) {
      span.setAttribute('endedBeforeFirstRow', true)
      end()
    }
  })
}
