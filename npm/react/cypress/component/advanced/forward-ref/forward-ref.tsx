import React from 'react'

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ children, ...rest }, ref) => (
  <button {...rest} ref={ref}>
    {children}
  </button>
))

Button.displayName = 'Button'

export default Button
