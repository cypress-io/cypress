import { observer } from 'mobx-react'
import React, { Component } from 'react'
import specsStore from './specs-store'
import { makeSpecHierarchy } from './make-spec-hierarchy'
import { SpecItem } from './spec-item'

@observer
class SpecsList extends Component {
  render () {
    const { state } = this.props
    const specGroups = specsStore.specs.length ? makeSpecHierarchy(specsStore.specs) : []

    return (
      <div className="specs-list">
        <header>Select tests to run...</header>
        <ul className="specs-list-container">{
          specGroups.map((item) => {
            { // The `active` prop here is used only to
              // force repaint of the tree when selecting a spec
              // It is not used for anything else than to patch react
              // not comparing members of an object (this.props.state in this case)
            }

            return <SpecItem key={item.shortName} active={state.spec?.name} item={item} state={state} />
          })}
        </ul>
      </div>
    )
  }
}

export default SpecsList
