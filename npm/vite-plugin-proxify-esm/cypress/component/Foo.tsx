import React from 'react'

export const Foo: React.FC<{ msg: string }> = (props) => {
  return (
    <h1>{props.msg}</h1>
  )
}
