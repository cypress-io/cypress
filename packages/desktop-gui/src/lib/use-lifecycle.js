import { useEffect } from 'react'

export const useLifecycle = ({ onMount, onUnmount }) => {
  return useEffect(() => {
    onMount && onMount()

    return () => {
      onUnmount && onUnmount()
    }
  }, [true])
}
