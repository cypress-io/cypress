import cs from 'classnames'
import React, { useRef } from 'react'
import { partial, uniqueId } from 'lodash'
import VisuallyHidden from '@reach/visually-hidden'

import useSelect from './use-select'

const SelectItem = ({ value, children, selectItem, ...rest }) => {
  const { name, handleChange, handleKeyDown, isSelected } = useSelect()
  const liRef = useRef()
  const inputRef = useRef()
  const id = uniqueId('select-item-')

  const onKeyDown = (e) => {
    // ensure it's not an element in children that's being keyed down
    if (e.target && e.target !== liRef.current && e.target !== inputRef.current) {
      return
    }

    handleKeyDown(e)
  }

  return (<li
    className={cs('select-item', { 'is-selected': isSelected(value) })}
    ref={liRef}
    onClick={partial(handleChange, value)}
    onKeyDown={onKeyDown}
    data-value={value}
  >
    <label htmlFor={id}>
      <i className='select-item-indicator fa' />
      <VisuallyHidden>
        <input
          {...rest}
          id={id}
          ref={inputRef}
          checked={isSelected(value)}
          onChange={partial(handleChange, value)}
          onKeyDown={onKeyDown}
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
