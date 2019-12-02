import React, { useContext } from 'react'
import context from './context'

const RadioInput = ({ value, ...rest }) => {
  const { groupName, handleChange, value: checkedValue } = useContext(context)
  const checked = checkedValue === value

  return (
    <input
      {...rest}
      checked={checked}
      onClick={(evt) => {
        handleChange(evt, value)
      }}
      name={groupName}
      type="radio"
      value={value}
    />
  )
}

export default RadioInput
