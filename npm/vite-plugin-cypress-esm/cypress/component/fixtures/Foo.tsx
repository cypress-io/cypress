import React from 'react'

export const Foo: React.FC<{ msg: string }> = (props) => {
  return (
    <h1>{props.msg}</h1>
  )
}

export class BarClassComponent extends React.Component<{ msg: string }> {
  /* eslint-disable @typescript-eslint/no-useless-constructor */
  constructor (props) {
    super(props)
  }

  render () {
    return (
      <h1>{this.props.msg}</h1>
    )
  }
}
