import React from 'react'

export default function Square ({ value }: { value?: string }) {
  return (
    <button className="square" onClick={() => alert('click')}>
      {value || null}
    </button>
  )
}
