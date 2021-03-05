import React from 'react'
import './devtools-fallback.scss'

export const ReactDevtoolsFallback: React.FC = () => {
  return (
    <p className='react-devtools-fallback'>Select a spec or re-run the current spec to activate devtools.</p>
  )
}
