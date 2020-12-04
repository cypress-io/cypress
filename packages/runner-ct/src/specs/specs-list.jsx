import { observer } from 'mobx-react'
import React, { Component } from 'react'
import specsStore from './specs-store'
import SpecGroup from './spec-group'
import StateContext from './spec-context'

@observer
class SpecsList extends Component {
  isActive = (spec) => {
    return this.props.state.runMode === 'multi'
      ? this.props.state.multiSpecs.some((includedSpec) => includedSpec.absolute === spec.absolute)
      : spec.name === this.props.state.spec?.name
  }

  render () {
    const specGroups = specsStore.specs.length ? makeSpecHierarchy(specsStore.specs) : {}

    return (
      <div className="specs-list">
        <header>Select tests to run...</header>
        <StateContext.Provider value={{
          activeSpec: this.props.state.spec?.name,
          chooseSpec: (spec, isMulti) => isMulti ? this.props.state.addSpecToMultiMode(spec) : this.props.state.setSpec(spec),
          isActive: this.isActive,
        }}>
          <ul>{

            Object.keys(specGroups).map((groupKey) => {
              const group = specGroups[groupKey]

              return (
                <SpecGroup
                  key={groupKey}
                  groupKey={groupKey}
                  group={group}/>
              )
            })}

          </ul>
        </StateContext.Provider>
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
