import cs from 'classnames'
import React, { useState } from 'react'

import { CollapseGroup } from './CollapseGroup'
import { ExpandGroup } from './ExpandGroup'
import { SpecFolder } from './make-spec-hierarchy'
import { SpecItem } from './SpecItem'
import { OnSelectSpec } from './SpecFileItem'
import './spec-group.scss'

interface SpecGroupProps {
  group: SpecFolder
  selectedSpecs: string[]
  onSelectSpec: OnSelectSpec
}

export const SpecGroupItem: React.FC<SpecGroupProps> = (props) => {
  const [open, setIsOpen] = useState(true)

  return (
    <li
      key={props.group.shortName}
      className='spec-list__group'
    >
      <a
        onClick={() => setIsOpen(!open)}
        className='spec-list__group-name'
        title={props.group.shortName}
      >
        <span className='spec-list__group-icon'>
          {open ? <CollapseGroup /> : <ExpandGroup />}
        </span>
        {props.group.shortName}
      </a>

      <ul className={cs('spec-list__group--specs')}>
        {
          props.group.specs.reduce<JSX.Element[]>((acc, item) => {
            if (!open) {
              return [<span key='unique' />]
            }

            return acc.concat(
              <SpecItem
                key={item.shortName}
                item={item}
                selectedSpecs={props.selectedSpecs}
                onSelectSpec={props.onSelectSpec}
              />,
            )
          }, [])
        }
      </ul>
    </li>
  )
}
