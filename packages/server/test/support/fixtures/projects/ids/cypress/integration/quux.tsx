import React from 'react'

interface Props {
  greeting: string
}

export const Foo = ({ greeting }: Props) => {
  return <div>{greeting}</div>
}
