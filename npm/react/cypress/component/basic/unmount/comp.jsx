import React, { useEffect } from 'react'

export const Comp = ({ onMount }) => {
  useEffect(() => {
    onMount()
  }, [])

  return <div>Component with mount and unmount calls</div>
}
