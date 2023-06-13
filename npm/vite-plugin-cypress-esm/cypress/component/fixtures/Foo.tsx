import React from 'react'

export const Foo: React.FC<{ msg: string }> = (props) => {
  return (
    <h1>{props.msg}</h1>
  )
}

class Animal {
  voice: string = 'Hello'

  greet () {
    return this.voice
  }
}

export class Dog extends Animal {
  constructor (voice: string) {
    super()
    this.voice = voice
  }
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
