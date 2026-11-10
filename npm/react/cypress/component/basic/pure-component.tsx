import React from 'react'

const Button = ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return <button {...rest}>{children}</button>
}

export default React.memo(Button)
