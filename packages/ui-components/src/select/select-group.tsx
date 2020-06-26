import cs from 'classnames'
import React, { Children, KeyboardEvent, ReactElement, ReactNode, useCallback, useMemo } from 'react'
import _ from 'lodash'
import Context from './context'

const generateGroupName = (name?: string) => {
  if (name) {
    return name
  }

  return _.uniqueId('Select-')
}

const toValues = (children: ReactNode[]) => {
  const withSelectItem = _.filter(children, (child: ReactElement) => {
    return child.props.selectItem
  })

  return _.map<any, string>(withSelectItem, (child: ReactElement) => child.props.value)
}

const left = 13
const up = 38
const right = 39
const down = 40

interface Props {
  children: ReactNode
  className?: string
  name?: string
  onChange?: (value: string) => any
  value: string
}

const Select = ({ children, className, name, onChange = _.noop, value }: Props) => {
  const allValues = useMemo(() => toValues(Children.toArray(children)), [children])

  const handleKeyDown = useCallback(({ keyCode }: KeyboardEvent) => {
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

export default Select
