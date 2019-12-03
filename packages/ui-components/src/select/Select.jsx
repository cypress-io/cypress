import React, { Children, useCallback, useMemo, useState } from 'react'
import { noop, uniqueId } from 'lodash'
import { filter, findIndex, flow, map } from 'lodash/fp'
import Context from './context'

const generateGroupName = (name) => {
  if (name) {
    return name
  }

  return uniqueId('Select-')
}

const toValues = flow(
  filter((child) => {
    return child.props.selectItem
  }),
  map((child) => child.props.value)
)

const left = 13
const up = 38
const right = 39
const down = 40

const Select = ({ children, multiSelect, name, onChange, value }) => {
  const allValues = useMemo(() => toValues(Children.toArray(children)), [children])
  const [checked, setChecked] = useState(value)

  const handleChange = useCallback((evt, value) => {
    setChecked(value)
    onChange(evt, value)
  }, [setChecked])

  const handleKeyDown = useCallback(({ keyCode }) => {
    if (![left, up, right, down].includes(keyCode)) {
      return
    }

    const findCurrentValueIndex = findIndex((v) => v === checked)
    const currentIndex = findCurrentValueIndex(allValues)

    if (currentIndex === -1) {
      setChecked(allValues[0])

      return
    }

    if ([left, up].includes(keyCode)) {
      const incrementedIndex = currentIndex - 1

      const newIndex = incrementedIndex < 0 ? (Math.abs(incrementedIndex) + allValues.length - 2) : (incrementedIndex) % (allValues.length)

      setChecked(allValues[newIndex])
    } else if ([right, down].includes(keyCode)) {
      const newIndex = (currentIndex + 1) % (allValues.length)

      setChecked(allValues[newIndex])
    }
  }, [allValues, checked, value])

  return (
    <Context.Provider value={{
      handleChange,
      handleKeyDown,
      isChecked: (v) => v === checked,
      name: generateGroupName(name),
      multiSelect,
    }}>
      {children}
    </Context.Provider>
  )
}

Select.defaultProps = {
  onChange: noop,
  multiSelect: false,
}

export default Select
