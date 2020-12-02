import { observer } from 'mobx-react'
import React, { Component } from 'react'
import specsStore from './specs-store'
import SpecGroup from './spec-group'

@observer
class SpecsList extends Component {
  render () {
    const specGroups = specsStore.specs.length ? makeSpecHierarchy(specsStore.specs) : {}

    return (
      <div className="specs-list">
        <header>Select tests to run...</header>
        <ul>{

          Object.keys(specGroups).map((groupKey) => {
            const group = specGroups[groupKey]

            return (<SpecGroup
              key={`${groupKey}#${this.props.state.spec?.name}`}
              groupKey={groupKey}
              group={group}
              chooseSpec={(spec) => this.chooseSpec(spec)}
              isActive={(spec) => this.isActive(spec)}/>)
          })}

        </ul>
      </div>
    )
  }

  chooseSpec (spec) {
    return () => {
      this.props.state.setSpec(spec)
    }
  }

  isActive (spec) {
    return spec.name === this.props.state.spec?.name
  }
}

/**
 * Split specs into group by their
 * first level of folder hierarchy
 *
 * @param {Array<{name: string}>} specs
 */
function makeSpecHierarchy (specs) {
  const groups = {}

  specs.forEach((spec) => {
    const pathArray = spec.name.split('/')

    let currentGroup = groups

    pathArray.forEach((pathPart, i) => {
      const tmpGroup = currentGroup[pathPart] || {}

      if (i < pathArray.length - 1) {
        currentGroup[pathPart] = tmpGroup
        currentGroup = tmpGroup
      } else {
        currentGroup[pathPart] = spec
      }
    })
  })

  return groups
}

export default SpecsList
