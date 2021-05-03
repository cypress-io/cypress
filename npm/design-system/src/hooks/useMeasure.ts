import { useCallback, useLayoutEffect, useState } from 'react'
import { useCurrent } from './useCurrent'

/**
 * Calculates the height of a DOM element
 *
 * **NOTE:** This causes multiple renders of your component to measure
 */
export const useMeasure = (expectedHeight: number, resizer: (height: number) => void, deps: any[], disable = false) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)
  const [measuring, setMeasuring] = useState(false)

  const currentRef = useCurrent(ref)
  const currentMeasuring = useCurrent(measuring)

  const remeasure = useCallback(() => setMeasuring(true), [])

  useLayoutEffect(() => {
    if (disable) {
      return
    }

    // On a new render (prop update), mark the component as ready to measure
    if (currentMeasuring.current) {
      return
    }

    setMeasuring(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useLayoutEffect(() => {
    // When we are measuring, measure the current DOM and update if necessary
    if (!measuring || !currentRef.current) {
      return
    }

    const measuredHeight = currentRef.current.getBoundingClientRect().height

    if (measuredHeight !== expectedHeight) {
      resizer(measuredHeight)
    }

    setMeasuring(false)
  }, [measuring, expectedHeight, resizer, currentRef])

  return {
    statefulRef: ref,
    ref: currentRef,
    setRef,
    remeasure,
  }
}
