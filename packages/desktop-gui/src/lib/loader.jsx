import cs from 'classnames'
import React from 'react'

const Loader = ({ children, className = '', fullscreen = false }) => (
  <span className={cs('loader', className,
    { 'loader-fullscreen': fullscreen }
  )}>
    <span className="spinner"></span>
    <span className='loader-content'>
      {children}
    </span>
  </span>
)

export default Loader
