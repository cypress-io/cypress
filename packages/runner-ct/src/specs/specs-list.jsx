import { observer } from 'mobx-react'
import React, { Component } from 'react'
import specsStore from './specs-store'
import SpecGroup from './spec-group'

@observer
class SpecsList extends Component {
  render () {
    const { state } = this.props
    const specGroups = specsStore.specs.length ? makeSpecHierarchy(specsStore.specs) : {}

    return (
      <div className="specs-list">
        <header>Select tests to run...</header>
        <ul>{

          Object.keys(specGroups).map((groupKey) => {
            const group = specGroups[groupKey]

            return (
              <SpecGroup
                key={groupKey}
                active={state.spec?.name}
                groupKey={groupKey}
                state={state}
                group={group}/>
            )
          })}
        </ul>
      </div>
    )
  }
}

/**
 * Split specs into group by their
 * first level of folder hierarchy
 *
 * @param {Array<{name: string}>} specs
 */
function makeSpecHierarchy (specs) {
  return specs.reduce((groups, spec) => {
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

    return groups
  }, {})
}

export default SpecsList
