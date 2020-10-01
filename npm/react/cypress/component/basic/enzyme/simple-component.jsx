import React from 'react'
import { SimpleContext } from './simple-context'

export class SimpleComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      id: props.id || 'unknown id',
    }
  }

  render() {
    console.log('context %o', this.context)
    return (
      <>
        <div>{this.context.name || 'context not set'}</div>
        <div className="id">{this.state.id}</div>
      </>
    )
  }
}

SimpleComponent.contextType = SimpleContext
