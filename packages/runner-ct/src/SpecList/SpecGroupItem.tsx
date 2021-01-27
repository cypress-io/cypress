import cs from 'classnames'
import React, { useState, useEffect } from 'react'

import { CollapseGroup } from './CollapseGroup'
import { SpecFolder } from '../specs/make-spec-hierarchy'
import { SpecItem } from './SpecItem'
import './spec-group.scss'

interface SpecGroupProps {
  group: SpecFolder
  selectedSpecs: string[]
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
        data-cy={`spec-folder-${props.group.shortName}`}
      >
        <span className='spec-list__group-icon'>
          {open ? <CollapseGroup /> : <CollapseGroup />}
        </span>
        {props.group.shortName}
      </a>

      <ul className={cs('spec-list__group--specs')}>
        {
          props.group.specs.reduce<JSX.Element[]>((acc, item) => {
            if (!open) {
              return [<></>]
            }

            return acc.concat(
              <SpecItem
                key={item.shortName}
                item={item}
                selectedSpecs={props.selectedSpecs}
              />,
            )
          }, [])
        }
      </ul>
    </li>
  )
}
