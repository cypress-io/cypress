import React, { useEffect } from 'react'

export const Comp = ({ onMount, onUnmount }) => {
  useEffect(() => {
    onMount()

    return onUnmount
  }, [])

  return <div>Component with mount and unmount calls</div>
}
