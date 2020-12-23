import * as React from 'react'
import { observer } from 'mobx-react'
import State from '../lib/state'
import { makeSpecHierarchy } from './make-spec-hierarchy'
import { SpecItem } from './spec-item'

interface SpecsListProps {
  state: State
}

export const SpecsList: React.FC<SpecsListProps> = observer(
  function SpecsList ({ state }) {
    const specGroups = state.filteredSpecs.length ? makeSpecHierarchy(state.filteredSpecs) : []

    return (
      <div className="specs-list">
        <header>
          <input
            placeholder='Select tests to run...'
            value={state.specSearchText}
            onChange={(e) => this.props.state.setSearchSpecText(e.currentTarget.value.toLowerCase())}
          />
        </header>
        <ul className="specs-list-container">{
          specGroups.map((item) => {
            { // The `active` prop here is used only to
              // force repaint of the tree when selecting a spec
              // It is not used for anything else than to patch react
              // not comparing members of an object (this.props.state in this case)
            }

            return <SpecItem key={item.shortName} item={item} state={state} />
          })}
        </ul>
      </div>
    )
  },
)
