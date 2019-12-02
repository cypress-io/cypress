import React, { useState } from 'react'
import { noop, uniqueId } from 'lodash'
import Context from './context'

const generateGroupName = (name) => {
  if (name) {
    return name
  }

  return uniqueId('RadioGroup-')
}

const RadioGroup = ({ children, icon, name, onChange, value }) => {
  const [checked, setChecked] = useState(value)
  const handleChange = (evt, value) => {
    setChecked(value)
    onChange(evt, value)
  }

  return (
    <Context.Provider value={{ groupName: generateGroupName(name), handleChange, value: checked }}>
      {children}
    </Context.Provider>
  )
}

RadioGroup.defaultProps = {
  onChange: noop,
}

export default RadioGroup
