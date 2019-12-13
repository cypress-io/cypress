import React from 'react'
import { partial } from 'lodash'
import useSelect from './useSelect'

const SelectItem = ({ value, selectItem, ...rest }) => {
  const { name, handleChange, handleKeyDown, isChecked, multiSelect } = useSelect()

  return (
    <input
      {...rest}
      checked={isChecked(value)}
      onChange={partial(handleChange, value)}
      onKeyDown={handleKeyDown}
      name={name}
      type={multiSelect ? 'checkbox' : 'radio'}
      value={value}
    />
  )
}

SelectItem.defaultProps = {
  selectItem: true,
}

export default SelectItem
