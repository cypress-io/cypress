import cs from 'classnames'
import React, { Children, useCallback, useMemo } from 'react'
import _ from 'lodash'
import Context from './context'

const generateGroupName = (name) => {
  if (name) {
    return name
  }

  return _.uniqueId('Select-')
}

const toValues = (children) => {
  const withSelectItem = _.filter(children, (child) => {
    return child.props.selectItem
  })

  return _.map(withSelectItem, (child) => child.props.value)
}

const left = 13
const up = 38
const right = 39
const down = 40

const Select = ({ children, className, name, onChange, value }) => {
  const allValues = useMemo(() => toValues(Children.toArray(children)), [children])

  const handleKeyDown = useCallback(({ keyCode }) => {
    if (![left, up, right, down].includes(keyCode)) {
      return
    }

    const currentIndex = _.findIndex(allValues, (v) => v === value)

    if (currentIndex === -1) {
      onChange(allValues[0])

      return
    }

    if ([left, up].includes(keyCode)) {
      const incrementedIndex = currentIndex - 1

      const newIndex = incrementedIndex < 0 ? (Math.abs(incrementedIndex) + allValues.length - 2) : (incrementedIndex) % (allValues.length)

      onChange(allValues[newIndex])
    } else if ([right, down].includes(keyCode)) {
      const newIndex = (currentIndex + 1) % (allValues.length)

      onChange(allValues[newIndex])
    }
  }, [allValues, value])

  return (
    <Context.Provider value={{
      handleChange: onChange,
      handleKeyDown,
      isSelected: (v) => v === value,
      name: generateGroupName(name),
    }}>
      <ul className={cs('select', className)}>
        {children}
      </ul>
    </Context.Provider>
  )
}

Select.defaultProps = {
  onChange: _.noop,
}

export default Select
