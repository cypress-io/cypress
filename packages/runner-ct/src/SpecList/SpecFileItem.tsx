import React from 'react'
import { SpecFile } from './make-spec-hierarchy'
import cs from 'classnames'
import './spec-file.scss'

export type OnSelectSpec = (spec: SpecFile) => void

interface SpecFileProps {
  spec: SpecFile
  selected: boolean
  onSelectSpec: OnSelectSpec
}

export const SpecFileItem: React.FC<SpecFileProps> = (props: SpecFileProps) => {
  return (
    <li
      key={props.spec.shortName}
      className='spec-list__file'
      onClick={(e) => {
        e.preventDefault()
        props.onSelectSpec(props.spec)
      }}
    >
      <div
        role="radio"
        aria-checked={props.selected}
        // this data attribute is required for focusing from spec list
        data-spec={props.spec.relative}
        className='spec-list__spec-file__radio'
        tabIndex={props.selected ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            props.onSelectSpec(props.spec)
          }
        }}
      >
        <span className='spec-list__spec-file__radio__input'>
          <span
            className={cs(
              'spec-list__radio-control',
              props.selected ? 'spec-list__radio-control--selected' : 'spec-list__radio-control--unselected',
            )}
          />
        </span>
        <span className='radio__label'>
          {props.spec.shortName}
        </span>
      </div>
    </li>
  )
}
