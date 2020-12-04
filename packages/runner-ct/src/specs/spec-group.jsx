import cs from 'classnames'
import React, { Component } from 'react'

class SpecGroup extends Component {
  constructor (props) {
    super(props)
    this.state = { isOpen: true }
  }

  render () {
    const { group, groupKey, parentPath = '', state } = this.props
    const { isOpen } = this.state

    return (<li key={groupKey} >
      <a onClick={() => this.setState({ isOpen: !isOpen })} >
        <i className={cs('far', isOpen ? 'fa-minus-square' : 'fa-plus-square')}/>
        {groupKey}
      </a>
      <ul className={cs(!isOpen && 'group-hidden')}>
        {Object.keys(group)
        .map((spec) => {
          const newParentPath = `${parentPath}/${groupKey}`

          return group[spec].name
            ? <SpecFile
              key={spec}
              path={newParentPath}
              state={state}
              spec={group[spec]}/>
            : <SpecGroup key={spec}
              groupKey={spec}
              group={group[spec]}
              state={state}
              parentPath={newParentPath}/>
        })}

      </ul>
    </li>)
  }
}

function SpecFile ({ path, spec, state }) {
  return (
    <li key={spec.name} onClick={() => state.setSpec(spec)}>
      <i className={isActive(spec, state.spec?.name) ? 'fas fa-check-square active' : 'far fa-square'}/>
      {spec.name.slice(path.length)}
    </li>)
}

function isActive (spec, activeSpec) {
  return activeSpec && spec.name === activeSpec
}

export default SpecGroup
