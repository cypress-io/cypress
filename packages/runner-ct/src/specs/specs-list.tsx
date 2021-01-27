import * as React from 'react'
import { observer } from 'mobx-react'
import State from '../lib/state'
import { makeSpecHierarchy } from './make-spec-hierarchy'
import { SpecItem } from './spec-item'
import { ExtendedConfigOptions } from '../app/app'

interface SpecsListProps extends React.HtmlHTMLAttributes<HTMLElement> {
  state: State
  config: ExtendedConfigOptions
}

export const SpecsList: React.FC<SpecsListProps> = observer(
  function SpecsList (props) {
    const specGroups = props.state.filteredSpecs.length ? makeSpecHierarchy(props.state.filteredSpecs) : []

    return (
      <section className="specs-list">
        <div className="specs-list-search-input-container">
          <input
            placeholder='Find a spec'
            value={props.state.specSearchText}
            onChange={(e) => props.state.setSearchSpecText(e.currentTarget.value.toLowerCase())}
          />
        </div>
        <div className="specs-list-scroll-container">
          <ul className="specs-items-container">{
            specGroups.map((item) =>
              <SpecItem key={item.shortName} item={item} state={props.state}/>)}
          </ul>
        </div>
      </section>
    )
  },
)
