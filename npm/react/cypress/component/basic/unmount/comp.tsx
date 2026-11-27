import React, { useEffect } from 'react'

interface CompProps {
  onMount: () => void
  onUnmount: () => void
}

export const Comp = ({ onMount, onUnmount }: CompProps) => {
  useEffect(() => {
    onMount()

    return onUnmount
  // eslint-disable-next-line @eslint-react/exhaustive-deps -- the callbacks fire once each, on mount and unmount
  }, [])

  return <div>Component with mount and unmount calls</div>
}
