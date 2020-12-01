import { observer } from 'mobx-react'
import React, { Component } from 'react'
import specsStore from './specs-store'

@observer
class SpecsList extends Component {
  render () {
    const specGroups = specsStore.specs.length ? makeSpecHierarchy(specsStore.specs) : {}

    return (
      <div className="specs-list">
        <header>Select tests to run...</header>
        <ul>
          {this.specGroup(specGroups)}
        </ul>
      </div>
    )
  }

  specGroup (groups, parentPath = '') {
    return Object.keys(groups).map((groupKey) => {
      const group = groups[groupKey]

      return (<li key={groupKey} >
        <i className="far fa-plus-square"/>{groupKey}
        <ul>
          {Object.keys(group)
          .map((spec) =>
            group[spec].name
              ? this.specUnit(`${parentPath}/${groupKey}`, group[spec], this.isActive(group[spec]))
              : this.specGroup({ [spec]: group[spec] }, `${parentPath}/${groupKey}`))
          }
        </ul>
      </li>)
    })
  }

  specUnit (path, spec, active) {
    return (<li key={spec.name} onClick={this.chooseSpec(spec)}>
      <i className={active ? 'fas fa-check-square active' : 'far fa-square'}/>{spec.name.slice(path.length)}
    </li>)
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
