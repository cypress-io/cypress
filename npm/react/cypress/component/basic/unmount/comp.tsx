import React, { useEffect } from 'react'

interface CompProps {
  onMount: () => void
  onUnmount: () => void
}

export const Comp = ({ onMount, onUnmount }: CompProps) => {
  useEffect(() => {
    onMount()

    return onUnmount
  }, [])

  return <div>Component with mount and unmount calls</div>
}
