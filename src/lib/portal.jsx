import _ from 'lodash'
import React, { Component } from 'react'
import { render } from 'react-dom'

class Portal extends Component {
  componentDidMount () {
    const id = `portal-${Portal.idNum++}`
    let element = document.getElementById(id)
    if (!element) {
      element = document.createElement('div')
      element.id = id
      document.body.appendChild(element)
    }
    this._element = element
    this.componentDidUpdate()
  }

  componentWillUnmount () {
    document.body.removeChild(this._element)
  }

  componentDidUpdate () {
    render((
      <div ref={(node) => this.domNode = node} {..._.omit(this.props, 'children')}>
        {this.props.children}
      </div>
    ), this._element)
  }

  render () {
    return null
  }
}

Portal.idNum = 0

export default Portal
