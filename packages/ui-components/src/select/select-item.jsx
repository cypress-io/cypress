import cs from 'classnames'
import React from 'react'
import { partial, uniqueId } from 'lodash'
import VisuallyHidden from '@reach/visually-hidden'

import useSelect from './use-select'

const SelectItem = ({ value, children, selectItem, ...rest }) => {
  const { name, handleChange, handleKeyDown, isSelected } = useSelect()
  const id = uniqueId('select-item-')

  return (<li
    className={cs('select-item', { 'is-selected': isSelected(value) })}
    onClick={partial(handleChange, value)}
    onKeyDown={handleKeyDown}
    data-value={value}
  >
    <label htmlFor={id}>
      <i className='select-item-indicator fa' />
      <VisuallyHidden>
        <input
          {...rest}
          id={id}
          checked={isSelected(value)}
          onChange={partial(handleChange, value)}
          onKeyDown={handleKeyDown}
          name={name}
          type='radio'
          value={value}
        />
      </VisuallyHidden>
      {children}
    </label>
  </li>)
}

SelectItem.defaultProps = {
  selectItem: true,
}

export default SelectItem
