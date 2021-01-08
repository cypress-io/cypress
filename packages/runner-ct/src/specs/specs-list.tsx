import * as React from 'react'
import { observer } from 'mobx-react'
import State from '../lib/state'
import { makeSpecHierarchy } from './make-spec-hierarchy'
import { SpecItem } from './spec-item'
import { ExtendedConfigOptions } from '../app/app'

interface SpecsListProps {
  state: State
  config: ExtendedConfigOptions
}

export const SpecsList: React.FC<SpecsListProps> = observer(
  function SpecsList ({ state, config }) {
    const specGroups = state.filteredSpecs.length ? makeSpecHierarchy(state.filteredSpecs) : []

    return (
      <div className="specs-list">
        <header>
          <h1>
            {config.projectName ?? document.title ?? 'Cypress'}
          </h1>

        </header>
        <div className="specs-list-search-input-container">
          <input
            placeholder='Select tests to run...'
            value={state.specSearchText}
            onChange={(e) => state.setSearchSpecText(e.currentTarget.value.toLowerCase())}
          />
        </div>
        <div className="specs-list-scroll-container">
          <ul className="specs-list-container">{
            specGroups.map((item) => {
              { // The `active` prop here is used only to
                // force repaint of the tree when selecting a spec
                // It is not used for anything else than to patch react
                // not comparing members of an object (state in this case)
              }

              return <SpecItem key={item.shortName} item={item} state={state} />
            })}
          </ul>
        </div>
      </div>
    )
  },
)
