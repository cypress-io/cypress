import * as React from 'react'
import type { TestingType } from '../types/shared'

interface RunnerButtonProps {
  selected: boolean
  testingType: TestingType
  onChange?: React.ChangeEventHandler<HTMLInputElement>
}

export const RunnerButton: React.FC<RunnerButtonProps> = (props) => {
  const { selected, testingType, onChange = () => {} } = props

  return (
    <label
      className={`text-left inline-block border-2 rounded-lg mx-2 p-3 w-xs cursor-pointer ${
        selected ? 'border-blue-500' : 'border-gray-500'
      }`}
      htmlFor="testingType"
    >
      <input
        type="radio"
        className={`mr-3 ${selected ? 'border-blue-500' : 'border-gray-500'}`}
        name="testingType"
        id="testingType"
        checked={props.selected}
        onChange={onChange}
      />
      <img className="mr-3 inline" src="https://via.placeholder.com/50" />
      {testingType}
    </label>
  )
}
