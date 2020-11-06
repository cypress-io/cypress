import React from 'react'

const Button = ({ children, ...rest }) => {
  return <button {...rest}>{children}</button>
}

export default React.memo(Button)
