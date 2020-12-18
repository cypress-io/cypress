import cs from 'classnames'
import React, { Component } from 'react'
import { SpecItem } from './spec-item'

class SpecGroup extends Component {
  constructor (props) {
    super(props)
    this.state = { isOpen: true }
  }

  render () {
    const { group, state } = this.props
    const { isOpen } = this.state

    return (<li key={group.shortName} >
      <a onClick={() => this.setState({ isOpen: !isOpen })} >
        <i className={cs('far', isOpen ? 'fa-minus-square' : 'fa-plus-square')}/>
        {group.shortName}
      </a>
      <ul className={cs(!isOpen && 'group-hidden')}>
        {group.specs.map((item) => {
          return <SpecItem key={item.shortName} item={item} state={state} />
        })}

      </ul>
    </li>)
  }
}

export { SpecGroup }
