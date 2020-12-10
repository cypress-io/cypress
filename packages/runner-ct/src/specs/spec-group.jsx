import cs from 'classnames'
import React, { Component } from 'react'
import { SpecFile } from './spec-file'

class SpecGroup extends Component {
  constructor (props) {
    super(props)
    this.state = { isOpen: true }
  }

  render () {
    const { group, parentPath = '', state } = this.props
    const { isOpen } = this.state

    return (<li key={group.shortName} >
      <a onClick={() => this.setState({ isOpen: !isOpen })} >
        <i className={cs('far', isOpen ? 'fa-minus-square' : 'fa-plus-square')}/>
        {group.shortName}
      </a>
      <ul className={cs(!isOpen && 'group-hidden')}>
        {group.specs.map((item) => {
          const newParentPath = `${parentPath}/${group.shortName}`

          return item.type === 'file'
            ? <SpecFile
              key={item.shortName}
              path={item.name}
              state={state}
              spec={item}/>
            : <SpecGroup
              key={item.shortName}
              group={item}
              state={state}
              parentPath={newParentPath}/>
        })}

      </ul>
    </li>)
  }
}

export default SpecGroup
