import { MutableRefObject, RefCallback, useEffect } from 'react'

/**
 * Joins the `externalRef` to receive the same boxed value as `localRef`
 *
 * **NOTE:** This will not update values after initial render. This is only sufficient for element refs
 */
export const useCombinedRefs = <T>(
  localRef: MutableRefObject<T>,
  externalRef: MutableRefObject<T> | RefCallback<T> | null
) => {
  useEffect(() => {
    if (!externalRef) {
      return
    }

    if (typeof externalRef === 'function') {
      externalRef(localRef.current)
    } else {
      externalRef.current = localRef.current
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalRef])
}
