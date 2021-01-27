import React from 'react'
import { SpecFile } from '../specs/make-spec-hierarchy'
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
      onClick={() => {
        props.onSelectSpec(props.spec)
      }}
    >
      <label
        className='spec-list__spec-file__radio'
        data-cy={props.selected ? 'selected-spec' : 'unselected-spec'}
      >
        <span className='spec-list__spec-file__radio__input'>
          <input
            className='spec-list__file--radio'
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
        <span
          className='radio__label'
          data-cy={`spec-${props.spec.shortName}`}
        >
          {props.spec.shortName}
        </span>
      </label>
    </li>)
}
