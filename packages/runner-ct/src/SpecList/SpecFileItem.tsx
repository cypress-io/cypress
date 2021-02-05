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
      <label
        className='spec-list__spec-file__radio'
        htmlFor={props.spec.shortName}
        role={props.selected ? 'selected-spec' : 'unselected-spec'}
        title={props.spec.shortName}
      >
        <span className='spec-list__spec-file__radio__input'>
          <input
            className='spec-list__file--radio'
            id={props.spec.shortName}
            type='radio'
            checked={props.selected}
            readOnly
          />
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
      </label>
    </li>)
}
