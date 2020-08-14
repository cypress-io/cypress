import React from 'react'
import { SimpleContext } from './simple-context'

export class SimpleComponent extends React.Component {
  render() {
    console.log('context %o', this.context)
    return <div>{this.context.name || 'context not set'}</div>
  }
}

SimpleComponent.contextType = SimpleContext
